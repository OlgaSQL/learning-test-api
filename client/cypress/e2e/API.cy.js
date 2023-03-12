import { faker } from '@faker-js/faker';
let accessToken;

describe('API', () => {
  before(() => {
    cy.log('should generate a random user');
    const email = faker.internet.email();
    const password = faker.internet.password();
    let authResponse;
    let request = {
      email: email,
      password: password
    };

    cy.request({
      method: 'POST',
      url: '/register',
      body: request
    }).then((response) => {
      authResponse = response;
      accessToken = response.body.accessToken;
      cy.log(response.body.accessToken);
    })

  });

  it('1.Get all posts. Verify HTTP response status code and content type', () => {
    cy.request('/posts')
      .then((response) => {
        expect(response.status).to.equal(200)
        expect(response.headers['content-type']).to.include('application/json')
      })
  })

  it('2.Get only first 10 posts. Verify HTTP response status code. Verify that only first posts are returned', () => {
    cy.request('posts?_page=1&_limit=10').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.length).to.eq(10)
    })
  })

  it('3.Get posts with id = 55 and id = 60. Verify HTTP response status code. Verify id values of returned records', () => {
    cy.request('/posts?id=55&id=60').then(response => {
      expect(response.status).to.eq(200);
      const posts = response.body;
      expect(posts).to.be.an('array');
      expect(posts).to.have.lengthOf(2);
      const ids = posts.map(post => post.id);
      expect(ids).to.have.members([55, 60]);
    });
  });

  it('4.Create a post. Verify HTTP response status code.', () => {
    cy.request({
      method: 'POST',
      url: '/664/posts',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('5.Create post with adding access token in header. Verify HTTP response status code. Verify post is created', () => {
    cy.request({
      method: 'POST',
      url: `/664/posts`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        title: 'New Post',
        content: 'This is my new post!',
      },
    }).then((response) => {
      expect(response.status).to.eq(201);

      cy.log('Verify the post is created');
      expect(response.body.title).to.eq('New Post');
      expect(response.body.content).to.eq('This is my new post!');
    });
  })

  it('6.Create post entity and verify that the entity is created. Verify HTTP response status code. Use JSON in body.', () => {
    cy.request({
      method: 'POST',
      url: '/posts',
      body: {
        title: 'My New Post',
        body: 'This is the body of my new post.',
        userId: 1
      }
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('id')
      expect(response.body.title).to.eq('My New Post')
      expect(response.body.body).to.eq('This is the body of my new post.')
      expect(response.body.userId).to.eq(1)
    })
  })

  it('7.Update non-existing entity. Verify HTTP response status code', () => {
    cy.request({
      method: 'PUT',
      url: '/posts',
      body: {
        name: 'New Entity Name',
        description: 'New Entity Description'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(404);
    });
  })

  it('8.Create post entity and update the created entity. Verify HTTP response status code and verify that the entity is updated', () => {
    let postId;

    cy.request('POST', '/posts', {
      title: 'My first post',
      body: 'This is my post',
      userId: 1
    }).then((response) => {
      postId = response.body.id;
      cy.log(JSON.stringify(response));
      cy.log(postId);
      expect(response.status).to.eq(201)

      cy.request('PUT', '/posts/' + postId, {
        title: 'My updated post',
        body: 'This is my updated post',
        userId: 1
      }).then((response) => {
        expect(response.status).to.eq(200)

        cy.request('GET', `/posts/${postId}`).should((response) => {
          expect(response.status).to.eq(200)
          expect(response.body.title).to.eq('My updated post')
          expect(response.body.body).to.eq('This is my updated post')
        })
      })
    })
  })

  it('9.Delete non-existing post entity. Verify HTTP response status code', () => {
    cy.request({
      method: 'DELETE',
      url: '/posts/' + 100000,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404)
    })
  })

  let postId;

  it('10. Create post entity, update the created entity, and delete the entity. Verify HTTP response status code and verify that the entity is deleted', () => {
    const post = {
      title: 'My first post',
      body: 'This is my post',
      userId: 1
    };

    cy.request({
      method: 'POST',
      url: '/posts',
      body: post
    }).then(response => {
      expect(response.status).to.eq(201);
      postId = response.body.id;

      it('updates the created post', () => {
        const updatedPost = {
          title: 'My updated post',
          body: 'This is my updated post',
          userId: 1
        };

        cy.request({
          method: 'PUT',
          url: `/posts/${postId}`,
          body: updatedPost
        }).then(response => {
          expect(response.status).to.eq(200);
          expect(response.body.title).to.eq(updatedPost.title);
          expect(response.body.body).to.eq(updatedPost.body);

          it('deletes the created post', () => {
            cy.request({
              method: 'DELETE',
              url: `/posts/${postId}`
            }).then(response => {
              expect(response.status).to.eq(200);
            });

            cy.request({
              method: 'GET',
              url: `/posts/${postId}`,
              failOnStatusCode: false
            }).then(response => {
              expect(response.status).to.eq(404);
            });
          });
        });
      });
    });
  });
})