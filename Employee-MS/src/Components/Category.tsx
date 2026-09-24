import axios from 'axios'
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'

const Category = () => {
  //  This is used to pitch the data from the database and due to the [] it will run only once when the component is mounted
  //  and the data will be stored in the category state variable
  const[category, setCategory] = useState([])
  useEffect(() => {
      axios.get('http://localhost:3000/auth/category')
      .then(result =>{      
          if(result.data.status){
              setCategory(result.data.Result)
          }
          else{
              alert(result.data.Error)
          }
      })
      .catch(err => console.log(err))
  }, [])



  return (
    <div className="px-12 mt-6">
      <div className='flex justify-center'>
        <h3> Category List </h3>
      </div>
      <Link to="/dashboard/add_category"  className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-success">Add Category </Link>
      
      <div className='mt-4'>
        <table className='table table-bordered table-striped table-hover'>
          {/* This is for table head */}
          <thead className='table-dark'>
            <tr className='text-center'>
              <th className='p-2'>Name</th>
            </tr>
          </thead>
          {/* This is for table body */}
          <tbody >
            {
              // This is used to map the data from the database and display it in the table
              category.map((c, index) => (               
                <tr key={index}>
                  <td>{c.name}</td>
                </tr>               
              ))
            }
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default Category
