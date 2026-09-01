import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const Employee = () => {
  const [employees, setEmployees] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get('http://localhost:3000/auth/employee')
      .then(result => {
        if (result.data.status) setEmployees(result.data.Result)
        else setError(result.data.Error)
      })
      .catch(err => setError(err.response?.data?.Error || 'Unable to load employees'))
  }, [])

  return (
    <div className="px-5 mt-3">
      <div className='d-flex justify-content-center'>
        <h3> Employee List </h3>
      </div>
      <Link to="/dashboard/add_employee" className="btn btn-success">Add Employee</Link>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      <div className='mt-3'>
        <table className='table table-bordered table-striped table-hover'>
          <thead className='table-dark'>
            <tr><th>Name</th><th>Email</th><th>Category</th><th>Salary</th><th>Address</th></tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.category}</td>
                <td>{employee.salary}</td>
                <td>{employee.address}</td>
              </tr>
            ))}
            {!employees.length && !error && <tr><td colSpan="5" className="text-center">No employees found.</td></tr>}
          </tbody>
        </table>
      </div>

    </div>
  ) 
}

export default Employee
Employee