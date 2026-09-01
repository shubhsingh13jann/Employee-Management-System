import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddEmployee = () => {

  const[category, setCategory] = useState([])
  const [values, setValues] = useState({ name: '', email: '', password: '', salary: '', address: '', category: '', image: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
      axios.get('http://localhost:3000/auth/category')
      .then(result =>{      
          if(result.data.status){
              setCategory(result.data.Result)
              setValues(current => ({ ...current, category: current.category || result.data.Result[0]?.name || '' }))
          }
          else{
              setError(result.data.Error)
          }
      })
      .catch(err => setError(err.response?.data?.Error || 'Unable to load categories'))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues(current => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    axios.post('http://localhost:3000/auth/add_employee', values)
      .then(result => {
        if (result.data.status) navigate('/dashboard/employee')
        else setError(result.data.Error)
      })
      .catch(err => setError(err.response?.data?.Error || 'Unable to save employee'))
      .finally(() => setIsSubmitting(false))
  }

  return (
    <div className="d-flex justify-content-center align-items-center h-75 ">
      <div className="p-3 rounded w-30 border mt-6">
        <h3 className="text-center">Add Employee</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form className="row-g-1" onSubmit={handleSubmit}>
          <div className="col-12">
            <label htmlFor="inputName" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control rounded-0"
              id="inputName"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Enter Name"
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="inputEmail4" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control rounded-0"
              id="inputEmail4"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="Enter Email"
              autoComplete="off"
              required
            />
          </div>
          <div className="col-12">
              <label htmlFor="inputPassword4" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control rounded-0"
                id="inputPassword4"
                name="password"
                value={values.password}
                onChange={handleChange}
                placeholder="Enter Password"
                required
              />

              <label htmlFor="inputSallary" className="form-label">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                value={values.salary}
                onChange={handleChange}
                className="form-control rounded-0"
                id="inputSalary"
                placeholder="Enter Salary"
                autoComplete="off"
                required
              />
          </div>
          <div className="col-12">
              <label htmlFor="inputAddress" className="form-label">
                Address
              </label>
              <input
                type="text"
                className="form-control rounded-0"
                id="inputAddress"
                name="address"
                value={values.address}
                onChange={handleChange}
                placeholder="1234 Main St"
                autoComplete="off"
                required
              />
          </div>
          <div className="col-12">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select name="category" id="category" className="form-select" value={values.category} onChange={handleChange} required>
                        <option value="">Select a category</option>
                        {category.map((c, index) => (
                        <option key={index} value={c.name}>
                            {c.name}
                        </option>
                        ))}
              </select>
          </div>
          <div className="col-12 mb-3">
              <label htmlFor="inputGroupFile01" className="form-label">
                Select Image
              </label>
              <input
              type="file"
              className="form-control rounded-0"
              id="inputGroupFile01"
              accept="image/*"
              onChange={(e) => setValues(current => ({ ...current, image: e.target.files[0]?.name || '' }))}
              />
          </div>
          <div className="col-12">
            <button disabled={isSubmitting} type="submit" className="btn btn-primary w-100 ">
              {isSubmitting ? 'Saving...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
