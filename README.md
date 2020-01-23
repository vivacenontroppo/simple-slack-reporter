# simple-slack-reporter
This is simple (only clear JS) slack reporter for test automation (here it's Android app using Espresso and firing it with ADB via shell). It checks the status, searches for important info, send it to slack and send log file to slack if failed.
It can be used to any other logs succesfully since it's very simple and all you have to do is change the keywords.
Change *** to your slack webhook and authorization tocken for file upload.