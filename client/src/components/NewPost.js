import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import '../App.css';
import { useMutation } from '@apollo/client';
import queries from '../queries';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const NewPost = () => {
	const [uploadImage, { data, loading, error }] = useMutation(queries.UPLOAD_IMAGE);
	const [fieldError, setFieldError] = useState(false);

	if (data) {
		return <Navigate to='/my-posts' />
	} else {
		return (
			<div className='newPost'>
				<h1>New Post</h1>
				{error && <div className='alert alert-danger' role='alert'>{error.message}</div>}
				<fieldset disabled={loading}>
					<Form className='form' onSubmit={(event) => {
						event.preventDefault();

						const url = event.target.url.value.trim();
						const description = event.target.description.value.trim();
						const posterName = event.target.posterName.value.trim();

						if (url.length === 0) {
							setFieldError(true);
						} else {
							uploadImage({
								variables: {
									url: url,
									description: description,
									posterName: posterName
								}
							});
						}
					}}>
						<Form.Group className='mb-3' controlId='url'>
							<Form.Label>Image URL</Form.Label>
							<Form.Control type='text' name='url' placeholder='Enter URL' />
						</Form.Group>
						{fieldError && <div className='alert alert-danger' role='alert'>Please enter an image URL.</div>}
						<Form.Group className='mb-3' controlId='description'>
							<Form.Label>Description</Form.Label>
							<Form.Control as='textarea' name='description' placeholder='Enter description' />
						</Form.Group>
						<Form.Group className='mb-3' controlId='posterName'>
							<Form.Label>Poster Name</Form.Label>
							<Form.Control type='text' name='posterName' placeholder='Enter name' />
						</Form.Group>
						<Button variant='primary' type='submit'>Submit</Button>
					</Form>
				</fieldset>
			</div>
		);
	}
	
};

export default NewPost;
