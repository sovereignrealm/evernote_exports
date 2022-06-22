
This is a simple web app to explore all the multiple html files exported in evernote.
A search field is also included to find a word within all the notes.

Example screenshot from http://localhost:8756/notebooks/programming




### REQUIREMENTS:

node version 14.18.2

### SETUP:

1) export evernote notes into multiple html files
2)
```
cd evernote_exports
```
3) move notebooks html files inside evernote_exports/notebooks
	Example: notebooks/programming/first_file.html
4) move all folders with attachments inside public/assets/imgs
5) Make sure inside the html files you have one named "Evernote_index." because it'll be used to list and sort the notes by date
6) To update the the images or attachments path from the htmls run from the command line:
```
npm run replace-paths <foldername with htmls inside notebooks folder>
```
7) 
```
npm start
```
8) if no other port specified then check http://localhost:8756
