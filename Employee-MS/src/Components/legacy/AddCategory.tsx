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
    <div className='flex justify-center items-center h-75 '>
        <div className='p-4 rounded w-30 border border-gray-200 '>
            <h2>Add Category</h2>
            {error && <div className='px-4 py-3 rounded relative bg-red-100 border border-red-400 text-red-700'>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className='mb-4'>
                    <label htmlFor="category"><strong>Category:</strong></label>
                    <input
                            type="text"
                            name="category"
                            placeholder="Enter Category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-none"
                    />
                </div>
                <button disabled={isSubmitting} className='px-4 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-success w-full rounded-none mb-2'>
                    {isSubmitting ? 'Saving...' : 'Add Category'}
                </button>
            </form>
        </div>
    </div>
  )
}

export default AddCategory
