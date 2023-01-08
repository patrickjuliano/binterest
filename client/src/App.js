import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import './App.css';

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import Images from './components/Images';
import NewPost from './components/NewPost';
import Error from './components/Error';

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider
} from '@apollo/client';

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: 'http://localhost:4000'
  })
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className='App'>
          <header>
            <Navbar fixed='top' bg='dark' variant='dark'>
              <Container>
                <Navbar.Brand className='ms-1 fs-4 fw-bold' href='/'>Binterest</Navbar.Brand>
                <Nav className='me-auto fs-5'>
                  <Nav.Link href='/'>Images</Nav.Link>
                  <Nav.Link href='/my-bin'>My Bin</Nav.Link>
                  <Nav.Link href='/my-posts'>My Posts</Nav.Link>
                </Nav>
              </Container>
            </Navbar>
          </header>
          <div className='App-body'>
            <Routes>
              <Route path='/' element={<Images page='images' />} />
              <Route path='/my-bin' element={<Images page='myBin' />} />
              <Route path='/my-posts' element={<Images page='myPosts' />} />
              <Route path='/new-post' element={<NewPost />} />
              <Route path='/error' element={<Error />} />
              <Route path='*' element={<Navigate to={'/error'} replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;
