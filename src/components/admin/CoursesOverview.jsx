import React from 'react';
import Table from '../common/Table';

const CoursesOverview = ({ searchQuery, filters }) => {
  const columns = [
    { header: 'Course Code', accessor: 'code' },
    { header: 'Course Name', accessor: 'name' },
    { header: 'Instructor', accessor: 'instructor' },
    { header: 'Students', accessor: 'students' },
    { header: 'Avg. Attendance', accessor: 'attendance' },
    { header: 'Status', accessor: 'status' }
  ];

  const data = [
    {
      id: 1,
      code: 'CS101',
      name: 'Introduction to Programming',
      instructor: 'Dr. Smith',
      students: 45,
      attendance: '87%',
      status: 'Active'
    },
    {
      id: 2,
      code: 'MATH202',
      name: 'Calculus II',
      instructor: 'Prof. Johnson',
      students: 38,
      attendance: '92%',
      status: 'Active'
    },
    {
      id: 3,
      code: 'PHY101',
      name: 'Physics Fundamentals',
      instructor: 'Dr. Williams',
      students: 42,
      attendance: '78%',
      status: 'Completed'
    },
    {
      id: 4,
      code: 'ENG205',
      name: 'English Literature',
      instructor: 'Prof. Brown',
      students: 35,
      attendance: '94%',
      status: 'Active'
    }
  ];

  return <Table columns={columns} data={data} />;
};

export default CoursesOverview;