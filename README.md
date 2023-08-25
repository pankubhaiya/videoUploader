# videoUpload


 // steps to go with the project.
 1. step 1 : = > clone the repo in your local system by=>  git clone myrepolink
 next do cd videoUploader in your terminal
  
 2. step2 : =>  run npm i in your terminal (to download all the dependencies)
 3. step3 : run npm i nodemon 
 4.  npm run server 

 // api routes(upload file and download compressed file)
 1. api to upload video to s3 as well as to local device
 http://localhost:3000/api/upload

 2. api to download the compressed file from s3
 http://localhost:3000/api/download/filename with extension