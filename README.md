# Status-Server

##### An API that helps users check if a webpage is up or down and prompts users with a text message if the state of saved sites changes

# API Structure

### dependency tree

|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|                                                                                                                                                                     |   
|  |--------------------------------------------------------------------------------------------------------------|                                                   |
|  |                                                                                                              |                                                   |
|  |        index -----------------------------------------                                                       |                                                   |
|  |         |                                            |                                                       |-------handles all user request and response       |
|  |    ----    ----                                      |                                                                                                           |
|  |   |           |                                      |           hanldles all routes on the server---------------------------------------------------------------|   |  |   |           |                                      |            
|  - server      workers--------------|                   |
|      |           |                  |                   |------initializes the server and workers
|      |           |                  |
|---handlers     logs-------|         |-----------handles all data logs and checks
       |           |        |
       |           |        |----------handles creation of logfiles and their compression and update
       |-----------|
             |
             |
           helpers-------handles hashing of passwords, parsing payload to json and 
             |
             |
           data---handles file creation and data extraction
             |
             |
          config--handles environment configuration
        
 
# Usage Guide
