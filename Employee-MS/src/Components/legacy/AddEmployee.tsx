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
    <div className="flex justify-center items-center h-75 ">
      <div className="p-6 rounded w-30 border border-gray-200 border-gray-200 mt-6">
        <h3 className="text-center">Add Employee</h3>
        {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}
        <form className="row-g-1" onSubmit={handleSubmit}>
          <div className="w-full px-6">
            <label htmlFor="inputName" className="block mb-2 font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
              id="inputName"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Enter Name"
              required
            />
          </div>
          <div className="w-full px-6">
            <label htmlFor="inputEmail4" className="block mb-2 font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
              id="inputEmail4"
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="Enter Email"
              autoComplete="off"
              required
            />
          </div>
          <div className="w-full px-6">
              <label htmlFor="inputPassword4" className="block mb-2 font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                id="inputPassword4"
                name="password"
                value={values.password}
                onChange={handleChange}
                placeholder="Enter Password"
                required
              />

              <label htmlFor="inputSallary" className="block mb-2 font-medium text-gray-700">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                value={values.salary}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                id="inputSalary"
                placeholder="Enter Salary"
                autoComplete="off"
                required
              />
          </div>
          <div className="w-full px-6">
              <label htmlFor="inputAddress" className="block mb-2 font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                id="inputAddress"
                name="address"
                value={values.address}
                onChange={handleChange}
                placeholder="1234 Main St"
                autoComplete="off"
                required
              />
          </div>
          <div className="w-full px-6">
              <label htmlFor="category" className="block mb-2 font-medium text-gray-700">
                Category
              </label>
              <select name="category" id="category" className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" value={values.category} onChange={handleChange} required>
                        <option value="">Select a category</option>
                        {category.map((c, index) => (
                        <option key={index} value={c.name}>
                            {c.name}
                        </option>
                        ))}
              </select>
          </div>
          <div className="w-full px-6 mb-6">
              <label htmlFor="inputGroupFile01" className="block mb-2 font-medium text-gray-700">
                Select Image
              </label>
              <input
              type="file"
              className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
              id="inputGroupFile01"
              accept="image/*"
              onChange={(e) => setValues(current => ({ ...current, image: e.target.files[0]?.name || '' }))}
              />
          </div>
          <div className="w-full px-6">
            <button disabled={isSubmitting} type="submit" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 w-full ">
              {isSubmitting ? 'Saving...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
