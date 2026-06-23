const { OrgUnit, Classroom, Student, StudentSnapshot } = require('../models');
const {
  getAdminScopeUnitIds,
  getUnitAdminScopeUnitIds,
  getHighestRole,
  isOrgWideAdmin,
} = require('./authz.service');

const aggregateRow = () => ({
  classrooms: 0,
  students: 0,
  solvedTotal: 0,
  streakTotal: 0,
  easyTotal: 0,
  mediumTotal: 0,
  hardTotal: 0,
  validSnapCount: 0,
});

const finalizeRow = (row) => {
  const syncRate =
    row.students > 0 ? Math.round((row.validSnapCount / row.students) * 100) : 0;
  return {
    ...row,
    avgSolved: row.validSnapCount ? Math.round(row.solvedTotal / row.validSnapCount) : 0,
    avgStreak: row.validSnapCount ? Math.round(row.streakTotal / row.validSnapCount) : 0,
    syncRate,
  };
};

const addStats = (target, source) => {
  target.classrooms += source.classrooms || 0;
  target.students += source.students || 0;
  target.solvedTotal += source.solvedTotal || 0;
  target.streakTotal += source.streakTotal || 0;
  target.easyTotal += source.easyTotal || 0;
  target.mediumTotal += source.mediumTotal || 0;
  target.hardTotal += source.hardTotal || 0;
  target.validSnapCount += source.validSnapCount || 0;
};

const resolveScope = async (user, orgMemberships, orgId, allUnits) => {
  const unitById = Object.fromEntries(allUnits.map((u) => [String(u._id), u]));
  const faculties = allUnits.filter((u) => u.type === 'faculty');
  const departments = allUnits.filter((u) => u.type === 'department');

  let allowedUnitIds = [];
  let role = null;
  let level = 'department';

  if (user.isSuperAdmin) {
    allowedUnitIds = allUnits.map((u) => String(u._id));
    role = 'super_admin';
    level = 'university';
  } else if (orgMemberships.length) {
    role = getHighestRole(orgMemberships);
    const adminScope = await getAdminScopeUnitIds(orgMemberships, orgId);
    const unitScope = await getUnitAdminScopeUnitIds(orgMemberships, orgId);
    const instructorScope = orgMemberships
      .filter((m) => m.role === 'instructor' && m.orgUnitId)
      .map((m) => String(m.orgUnitId));

    allowedUnitIds = [...new Set([...adminScope, ...unitScope, ...instructorScope])];

    if (role === 'org_admin') {
      const orgWide = orgMemberships.some((m) => isOrgWideAdmin(m));
      level = orgWide ? 'university' : 'faculty';
    } else if (role === 'unit_admin') {
      level = 'department';
    } else {
      level = 'instructor';
    }
  }

  const allowedDeptIds = departments
    .filter((d) => allowedUnitIds.includes(String(d._id)))
    .map((d) => String(d._id));

  const allowedFacultyIds = faculties
    .filter((f) => {
      const subtreeHasDept = departments.some(
        (d) => String(d.parentId) === String(f._id) && allowedDeptIds.includes(String(d._id))
      );
      return allowedUnitIds.includes(String(f._id)) || subtreeHasDept;
    })
    .map((f) => String(f._id));

  const scopeLabel =
    role === 'super_admin'
      ? 'Platform — full institution'
      : role === 'org_admin' && level === 'university'
        ? 'University — all faculties & departments'
        : role === 'org_admin'
          ? 'Faculty dean — all departments below'
          : role === 'unit_admin'
            ? 'HOD — department scope'
            : 'Instructor — your classrooms';

  return {
    role,
    level,
    label: scopeLabel,
    allowedUnitIds,
    allowedDeptIds,
    allowedFacultyIds,
    unitById,
    faculties,
    departments,
  };
};

const buildOrgAnalytics = async ({ org, user, orgMemberships, query = {} }) => {
  const allUnits = await OrgUnit.find({ orgId: org._id }).lean();
  const scope = await resolveScope(user, orgMemberships, org._id, allUnits);
  const { unitById, allowedDeptIds } = scope;

  const qFaculty = query.facultyId ? String(query.facultyId) : '';
  const qDepartment = query.departmentId ? String(query.departmentId) : '';
  const qInstructor = query.instructorId ? String(query.instructorId) : '';

  const classroomFilter = { orgId: org._id };
  if (!user.isSuperAdmin && allowedDeptIds.length) {
    classroomFilter.orgUnitId = { $in: allowedDeptIds };
  }

  if (scope.role === 'instructor') {
    const instructorDepts = orgMemberships
      .filter((m) => m.role === 'instructor' && m.orgUnitId)
      .map((m) => String(m.orgUnitId));
    const orClauses = [];
    for (const deptId of instructorDepts) {
      const unit = unitById[deptId];
      const visibility = unit?.settings?.instructorVisibility || 'own';
      if (visibility === 'unit_shared') {
        orClauses.push({ orgUnitId: deptId });
      } else {
        orClauses.push({ orgUnitId: deptId, createdBy: user._id });
      }
    }
    if (orClauses.length) {
      delete classroomFilter.orgUnitId;
      classroomFilter.$or = orClauses;
    }
  }

  if (qDepartment) {
    if (!user.isSuperAdmin && !allowedDeptIds.includes(qDepartment)) {
      return { scope, summary: emptySummary(), comparisons: emptyComparisons(), hierarchy: [] };
    }
    if (classroomFilter.$or) {
      classroomFilter.$or = classroomFilter.$or.filter(
        (clause) => String(clause.orgUnitId) === qDepartment
      );
      if (!classroomFilter.$or.length) {
        return { scope, summary: emptySummary(), comparisons: emptyComparisons(), hierarchy: [] };
      }
    } else {
      classroomFilter.orgUnitId = qDepartment;
    }
  }
  if (qInstructor) classroomFilter.createdBy = qInstructor;
  if (query.search) classroomFilter.name = { $regex: query.search, $options: 'i' };

  let classrooms = await Classroom.find(classroomFilter)
    .populate('createdBy', 'name email')
    .populate('orgUnitId', 'name parentId type')
    .lean();

  if (qFaculty) {
    classrooms = classrooms.filter((c) => {
      const dept = unitById[String(c.orgUnitId?._id || c.orgUnitId)];
      return dept && String(dept.parentId || '') === qFaculty;
    });
  }

  const classroomIds = classrooms.map((c) => c._id);
  const students = classroomIds.length
    ? await Student.find({ classroomId: { $in: classroomIds }, status: 'active' })
        .select('classroomId latestSnapshotId')
        .lean()
    : [];

  const snapshotIds = students.map((s) => s.latestSnapshotId).filter(Boolean);
  const snapshots = snapshotIds.length
    ? await StudentSnapshot.find({ _id: { $in: snapshotIds } })
        .select('totalSolved streak syncError easy medium hard')
        .lean()
    : [];
  const snapById = Object.fromEntries(snapshots.map((s) => [String(s._id), s]));

  const classStats = {};
  for (const c of classrooms) {
    const deptId = String(c.orgUnitId?._id || c.orgUnitId || '');
    const dept = unitById[deptId];
    const facultyId = dept?.parentId ? String(dept.parentId) : '';
    const faculty = facultyId ? unitById[facultyId] : null;

    classStats[String(c._id)] = {
      classroomId: String(c._id),
      name: c.name,
      slug: c.slug,
      departmentId: deptId,
      departmentName: c.orgUnitId?.name || dept?.name || 'Department',
      facultyId,
      facultyName: faculty?.name || '',
      instructorId: String(c.createdBy?._id || c.createdBy || ''),
      instructorName: c.createdBy?.name || 'Instructor',
      students: 0,
      solvedTotal: 0,
      streakTotal: 0,
      easyTotal: 0,
      mediumTotal: 0,
      hardTotal: 0,
      validSnapCount: 0,
    };
  }

  for (const s of students) {
    const row = classStats[String(s.classroomId)];
    if (!row) continue;
    row.students += 1;
    const snap = s.latestSnapshotId ? snapById[String(s.latestSnapshotId)] : null;
    if (snap && !snap.syncError) {
      row.solvedTotal += snap.totalSolved || 0;
      row.streakTotal += snap.streak || 0;
      row.easyTotal += snap.easy || 0;
      row.mediumTotal += snap.medium || 0;
      row.hardTotal += snap.hard || 0;
      row.validSnapCount += 1;
    }
  }

  const classRows = Object.values(classStats).map((r) =>
    finalizeRow({ ...r, classrooms: 1 })
  );

  const byFaculty = {};
  const byDepartment = {};
  const byInstructor = {};

  for (const r of classRows) {
    if (r.facultyId) {
      if (!byFaculty[r.facultyId]) {
        byFaculty[r.facultyId] = {
          facultyId: r.facultyId,
          facultyName: r.facultyName || 'Faculty',
          ...aggregateRow(),
        };
      }
      addStats(byFaculty[r.facultyId], r);
    }

    if (!byDepartment[r.departmentId]) {
      byDepartment[r.departmentId] = {
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        facultyId: r.facultyId,
        facultyName: r.facultyName,
        ...aggregateRow(),
        instructorIds: new Set(),
      };
    }
    byDepartment[r.departmentId].instructorIds.add(r.instructorId);
    addStats(byDepartment[r.departmentId], r);

    if (!byInstructor[r.instructorId]) {
      byInstructor[r.instructorId] = {
        instructorId: r.instructorId,
        instructorName: r.instructorName,
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        facultyId: r.facultyId,
        facultyName: r.facultyName,
        ...aggregateRow(),
      };
    }
    addStats(byInstructor[r.instructorId], r);
  }

  const facultyRows = Object.values(byFaculty)
    .map((f) => finalizeRow(f))
    .sort((a, b) => b.students - a.students);

  const departmentRows = Object.values(byDepartment)
    .map((d) => ({
      ...finalizeRow(d),
      instructors: d.instructorIds.size,
    }))
    .sort((a, b) => b.students - a.students);

  const instructorRows = Object.values(byInstructor)
    .map((i) => finalizeRow(i))
    .sort((a, b) => b.students - a.students);

  const hierarchyMap = {};

  for (const r of classRows) {
    const fid = r.facultyId || '_none';
    if (!hierarchyMap[fid]) {
      hierarchyMap[fid] = {
        facultyId: r.facultyId || null,
        facultyName: r.facultyName || 'Organization',
        ...aggregateRow(),
        departments: {},
      };
    }
    addStats(hierarchyMap[fid], r);

    const did = r.departmentId;
    if (!hierarchyMap[fid].departments[did]) {
      hierarchyMap[fid].departments[did] = {
        departmentId: did,
        departmentName: r.departmentName,
        ...aggregateRow(),
        instructors: {},
      };
    }
    addStats(hierarchyMap[fid].departments[did], r);

    const iid = r.instructorId;
    if (!hierarchyMap[fid].departments[did].instructors[iid]) {
      hierarchyMap[fid].departments[did].instructors[iid] = {
        instructorId: iid,
        instructorName: r.instructorName,
        ...aggregateRow(),
        classroomItems: [],
      };
    }
    addStats(hierarchyMap[fid].departments[did].instructors[iid], r);
    hierarchyMap[fid].departments[did].instructors[iid].classroomItems.push({
      classroomId: r.classroomId,
      name: r.name,
      slug: r.slug,
      students: r.students,
      avgSolved: r.avgSolved,
      avgStreak: r.avgStreak,
      syncRate: r.syncRate,
      easyTotal: r.easyTotal,
      mediumTotal: r.mediumTotal,
      hardTotal: r.hardTotal,
    });
  }

  const hierarchy = Object.values(hierarchyMap)
    .map((fac) => ({
      ...finalizeRow(fac),
      departments: Object.values(fac.departments)
        .map((dept) => ({
          ...finalizeRow(dept),
          instructors: Object.values(dept.instructors)
            .map((inst) => {
              const { classroomItems, ...stats } = inst;
              return {
                ...finalizeRow(stats),
                classrooms: [...(classroomItems || [])].sort((a, b) => b.avgSolved - a.avgSolved),
              };
            })
            .sort((a, b) => b.students - a.students),
        }))
        .sort((a, b) => b.students - a.students),
    }))
    .sort((a, b) => b.students - a.students);

  const totalValidSnaps = classRows.reduce((sum, r) => sum + r.validSnapCount, 0);
  const summary = {
    classrooms: classRows.length,
    students: students.length,
    faculties: facultyRows.length,
    departments: departmentRows.length,
    instructors: instructorRows.length,
    avgSolvedOverall: totalValidSnaps
      ? Math.round(classRows.reduce((sum, r) => sum + r.solvedTotal, 0) / totalValidSnaps)
      : 0,
    syncRateOverall:
      students.length > 0 ? Math.round((totalValidSnaps / students.length) * 100) : 0,
  };

  return {
    scope: {
      role: scope.role,
      level: scope.level,
      label: scope.label,
    },
    summary,
    filters: { facultyId: qFaculty, departmentId: qDepartment, instructorId: qInstructor },
    comparisons: {
      byFaculty: facultyRows,
      byDepartment: departmentRows,
      byInstructor: instructorRows,
      byClassroom: [...classRows].sort((a, b) => b.avgSolved - a.avgSolved),
      topClassrooms: [...classRows].sort((a, b) => b.avgSolved - a.avgSolved).slice(0, 10),
      needsAttention: [...classRows].sort((a, b) => a.avgSolved - b.avgSolved).slice(0, 10),
    },
    hierarchy,
  };
};

const emptySummary = () => ({
  classrooms: 0,
  students: 0,
  faculties: 0,
  departments: 0,
  instructors: 0,
  avgSolvedOverall: 0,
  syncRateOverall: 0,
});

const emptyComparisons = () => ({
  byFaculty: [],
  byDepartment: [],
  byInstructor: [],
  byClassroom: [],
  topClassrooms: [],
  needsAttention: [],
});

module.exports = { buildOrgAnalytics };
