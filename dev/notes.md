# Notes

## Version 0.2 - 26 Jan 2015
- newly implemented features:
    + indents in code blocks
    + nested lists (two levels)
    + multiple lines per paragraph
    + title on anchors
    + manual line breaks by (at least) two indents

- not (yet) implemented features, todo stuff:
    + special chars escaping
    + buttons for selection markup of span elements
    + pass wrapper element selector to plugin as parameter
    + test and fix pdf export (images don't work)
    + export html with inline css
    + inline html input support


## Version 0.1 - 15 Jan 2015
- implemented features:
    + parse block elements:
        + headlines (h1 - h6), atx-style only
        + horizontal lines
        + paragraphs
        + ordered lists
        + unordered lists
        + quote blocks
        + code blocks
    + parse span elements:
        + strong
        + emphasised
        + inline code
        + images
        + anchors
    + buttons for line by line markup, block elements only

- not (yet) implemented features, todo stuff:
    + buttons for selection markup of span elements
    + nested lists
    + empty lines, multiple lines per paragraph
    + manual line breaks
    + styling
    + pass wrapper element selector to plugin as parameter
    + export pdf
    + export html/css
    + export md file
    + styling