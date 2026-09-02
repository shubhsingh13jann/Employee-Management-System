import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AddCategory = () => {

    const[category, setCategory] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = (e) =>{
        e.preventDefault()
        if (!category.trim()) return setError('Category name is required')
        setError('')
        setIsSubmitting(true)
        axios.post('http://localhost:3000/auth/add_category', {category})
        .then(result => {
            if(result.data.status){
                navigate('/dashboard/category')
            }
            else{
                setError(result.data.Error)
            }
        })
        .catch(err => setError(err.response?.data?.Error || 'Unable to save category'))
        .finally(() => setIsSubmitting(false))
    }



  return (
    <div className='d-flex justify-content-center align-items-center h-75 '>
        <div className='p-3 rounded w-30 border '>
            <h2>Add Category</h2>
            {error && <div className='alert alert-danger'>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className='mb-3'>
                    <label htmlFor="category"><strong>Category:</strong></label>
                    <input
                            type="text"
                            name="category"
                            placeholder="Enter Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-control rounded-0"
                    />
                </div>
                <button disabled={isSubmitting} className='btn btn-success w-100 rounded-0 mb-2'>
                    {isSubmitting ? 'Saving...' : 'Add Category'}
                </button>
            </form>
        </div>
    </div>
  )
}

export default AddCategory
