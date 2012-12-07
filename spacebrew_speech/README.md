This uses Webkit's speech input field and broadcasts a string on SpaceBrew

Run the app on a web server. Click the audio icon, talk. When new word are detected, the page will send it out on SpaceBrew.

Use the following query string:
[PATH TO HTML]/index.html?server=[REPLACE WITH YOUR SEVER NAME]&name=speech-sender

This has only been tested in Chrome.

Live Example: http://www.211c.com/speech/app.html?server=lab-server&name=speech-sender-211c
About Speech Field: http://www.phpied.com/x-webkit-speech-input-and-textareas/
