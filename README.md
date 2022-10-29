# image-meta-fixer

Replaces file `created` and `content created` metadata with timestamp from exif.

## Usage — fix metadata and sort

`cd` to this directory.
Run `yarn action <INPUT_DIRECTORY> <OUTPUT_DIRECTORY> --fix --move`

## Usage — set metadata and sort

`cd` to this directory.
Run `yarn set <INPUT_FILE(S)> <DATE> <OUTPUT_DIRECTORY>` where `<DATE>` is in format `YYYY:MM:DD HH:mm:ss` and `<INPUT_FILE(S)>` is either a single file path or a directory.
