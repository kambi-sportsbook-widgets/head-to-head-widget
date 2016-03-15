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
        "offering": "offering",
        "historyLimit": 6
    }
},
...

```

### The widget accepts the following arguments/s:
1. `offering` - string - __REQUIRED__ - The offering provided by Kambi
2. `historyLimit` - integer - defaults to 6 - The max amount of items to show in the meetup history

# Other tools

For setting up sass maps, follow this tutorial https://www.hackmonkey.com/2014/sep/configuring-css-source-maps-compass

To use Scss Lint, run "gem install scss_lint"

# Changelog

changelog can be found [here](CHANGELOG.md)

