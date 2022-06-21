# Status-Server

##### An API that helps users check if a webpage is up or down and prompts users with a text message if the state of saved sites changes

# API Structure

### dependency tree

           index 
             |   
       ----    ----   
       |           |
       |           |         
    server      workers     
       |           |         
       |           |              
     handlers     logs        
       |           |      
       |           |        
       |-----------|
             |
             |
           helpers
             |
             |
           data
             |
             |
          config
          
          index--initializes the server and workers.
          
          servers---handles all user request and response.
          
          workers-----handles all data logs and checks.
          
          handlers---hanldles all routes on the server.
          
          logs----handles creation of logfiles and their compression and update.
          
          helpers---handles hashing of passwords, parsing payload to json , texting users, creating.
          
          data----handles file creation and data extraction.
          
          config---handles environment configuration.
        
 
# Usage Guide

#### id serves as a private key while publickey serves as a public key
## Routes

### /ping

##### checks if the API is or down

```bash

const options = {
  method: 'GET',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'}
};

fetch('https://status.up.railway.app/ping', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  
  ### /tokens
  
  ### A token is a a key needed by a user to edit data i.e a token is required to
  #### POST
  
  ##### used to create a user, reqiured parameters are
  
  ###### payload
  
  - phone
  - password

```bash

const options = {
  method: 'POST',
  headers: {publickey: 'm28yk6ju7nmqmevz780e'},
  body: '{"password":"lightighvt","phone":"8022623069"}'
};

fetch('https://status.up.railway.app/tokens', options)
  .then(response => response.json())
  .then(response => console.log(response)) // returns { phone, id, expires }
  .catch(err => console.error(err));
  
  ```
  
  #### GET
  
  ##### used to get user stored data reqires
  
  ###### headers
  - id
  
  ###### query
  - phone
 
 ```bash
 
 const options = {
  method: 'GET',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'}
};

fetch('https://status.up.railway.app/users', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  #### PUT
  
  ##### used to update user data requires
  
  ###### headers
  - id
  
  ###### payload
  - firstName (optional)
  - lastName (optional)
  - password (optional)
  - phone (required)
  
```bash 
const options = {
  method: 'PUT',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'},
  body: '{"lastName":"onyela","firstName":"Udoka","password":"lightighvt","countrycode":"234","phone":"8022623069","tosAgreement":true}'
};

fetch('https://status.up.railway.app/users', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
 ```
#### DELETE

##### used to delete a user's data requires

  ###### headers
  - id
  
  ###### payload
  - phone
 
```bash
const options = {
  method: 'GET',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'}
};

fetch('https://status.up.railway.app/users?phone=8022623069', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  
  

  

  ### /users
  
  #### POST
  
  ##### used to create a user, reqiured parameters are
  
  ###### payload
  
  - firstName
  - lastName
  - phone
  - password
  - tosAgreement

```bash

const options = {
  method: 'POST',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'},
  body: '{"lastName":"onyela","firstName":"Udoka","password":"lightighvt","countrycode":"234","phone":"8022623069","tosAgreement":true}'
};

fetch('https://status.up.railway.app/users', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  
  #### GET
  
  ##### used to get user stored data reqires
  
  ###### headers
  - id
  
  ###### query
  - phone
 
 ```bash
 
 const options = {
  method: 'GET',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'}
};

fetch('https://status.up.railway.app/users', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  #### PUT
  
  ##### used to update user data requires
  
  ###### headers
  - id
  
  ###### payload
  - firstName (optional)
  - lastName (optional)
  - password (optional)
  - phone (required)
  
```bash 
const options = {
  method: 'PUT',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'},
  body: '{"lastName":"onyela","firstName":"Udoka","password":"lightighvt","countrycode":"234","phone":"8022623069","tosAgreement":true}'
};

fetch('https://status.up.railway.app/users', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
 ```
#### DELETE

##### used to delete a user's data requires

  ###### headers
  - id
  
  ###### payload
  - phone
 
```bash
const options = {
  method: 'GET',
  headers: {publickey: 'm28yk6ju7nmqmevz780e', id: '7afrngqinomsv37pt1g0'}
};

fetch('https://status.up.railway.app/users?phone=8022623069', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err));
  
  ```
  
  

  
