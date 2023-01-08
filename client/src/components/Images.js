import React, { useState } from 'react';
import '../App.css';
import { useMutation, useQuery } from '@apollo/client';
import queries from '../queries';

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

const Images = (props) => {
	if (props.page === 'images') {
		var query = queries.GET_UNSPLASH_IMAGES;
		var title = 'Images';
		var warning = 'Unable to fetch images!';
	} else if (props.page === 'myBin') {
		var query = queries.GET_BINNED_IMAGES;
		var title = 'My Bin';
		var warning = 'Your bin is empty!';
	} else if (props.page === 'myPosts') {
		var query = queries.GET_USER_POSTED_IMAGES;
		var title = 'My Posts';
		var warning = `You haven't made any posts yet!`;
	}

	const [updateImage] = useMutation(queries.UPDATE_IMAGE, {
		refetchQueries: [{ query: query }]
	});
	const [deleteImage] = useMutation(queries.DELETE_IMAGE, {
		refetchQueries: [{ query: query }]
	});
	const [pageNum, setPageNum] = useState(1);
	const [oldImagePosts, setOldImagePosts] = useState([]);

    const { data, loading, error } = useQuery(query, {
        fetchPolicy: 'cache-and-network',
		...(props.page === 'images' && {variables: {pageNum: pageNum}})
    });

    if (data || oldImagePosts.length > 0) {
		const imagePosts = data ? Object.values(data)[0] : [];
		const allImagePosts = oldImagePosts.concat(imagePosts);
		if (allImagePosts.length === 0) {
            var content = <div className='alert alert-danger' role='alert'>{warning}</div>
        } else {
			var content =
				<div>
					<Row className='g-3' xs={1} sm={2} md={4} lg={6}>
						{allImagePosts.map((imagePost, _) => (
							<Col className='d-flex'>
								<Card bg='dark' text='light'>
									<Card.Img variant='top' src={imagePost.url} alt={imagePost.description} />
									<Card.Body>
										<Card.Title>{imagePost.posterName}</Card.Title>
										<Card.Text>{imagePost.description}</Card.Text>
									</Card.Body>
									<Button className='button' variant={imagePost.binned ? 'secondary' : 'primary'} disabled={loading} onClick={() => {
										const binned = !imagePost.binned;
										updateImage({
											variables: {
												id: imagePost.id,
												url: imagePost.url,
												posterName: imagePost.posterName,
												description: imagePost.description,
												userPosted: imagePost.userPosted,
												binned: binned
											}
										});
										setOldImagePosts(oldImagePosts.map(post => post.id === imagePost.id ? {
											id: imagePost.id,
											url: imagePost.url,
											posterName: imagePost.posterName,
											description: imagePost.description,
											userPosted: imagePost.userPosted,
											binned: binned
										} : post));
									}}>{imagePost.binned ? 'Remove from Bin' : 'Add to Bin'}</Button>
									{props.page === 'myPosts' && <Button className='button' variant='danger' onClick={() => deleteImage({
										variables: {
											id: imagePost.id
										}
									})}>Delete</Button>}
								</Card>
							</Col>
						))}
					</Row>
					{props.page === 'images' && <Button className='getMoreButton' variant='primary' size='lg' disabled={loading} onClick={() => {
						setPageNum(pageNum + 1);
						setOldImagePosts(allImagePosts);
					}}>Get More</Button>}
				</div>
		}
    } else if (loading) {
        var content = <div className='alert alert-secondary' role='alert'>Loading...</div>;
    } else if (error) {
        var content = <div className='alert alert-danger' role='alert'>{error.message}</div>;
    }

	return (
		<div className='images'>
			<h1>{title}</h1>
			{props.page === 'myPosts' && <Button className='newPostButton' href='/new-post' variant='primary' size='lg'>New Post</Button>}
			{content}
		</div>
	)
};

export default Images;
