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
