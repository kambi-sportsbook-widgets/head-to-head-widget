# head-to-head-widget

Displays the meetup history of two teams

## Configuration example:

__`client-widgets.js`__

```json

...
{
    "order": 1,
    "widgetId": "Event poll widget",
    "args": {
        "title": "Head to Head",
        "eventId": "1002788509"        
    }
},
...

```

### The widget accepts the following arguments/s:

- title [String]

 The title to show on the header of the widgets

- eventId [Number]

 Id of the event to get data from

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Changelog

changelog can be found [here](CHANGELOG.md)
