# Annoor Hospital Bahmniapps

The *MAF-rebase-new* branch is an attempt to update *MAF* using changes in upstream master. The idea is that this will replace *MAF*.

In the future, additional updates/changes could be made as follows:
- Make changes to MAF branch, creating commits as needed
- Often merge in upstream commits from master, creating merge commits along the way.

# Bahmni Apps

[![Build Status](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps.svg?branch=master)](https://travis-ci.org/Bahmni/openmrs-module-bahmniapps)

This repository acts as the front end for the **Bahmni EMR**. It is compeltely written in **AngularJS**.


# Build

Please visit https://bahmni.atlassian.net/wiki/display/BAH/Working+on+Bahmni+OpenMRS+frontend for detailed instructions on **building** and **deploying** the front end

# Project structure

<pre>
|-- .tx
|   
|-- scripts
|	
`-- ui
    |-- Gruntfile.js
    |-- app
    |	|-- admin
    |   |-- adt
    |   |-- clinical
    |   |-- common
    |   |-- document-upload
    |   |-- home
    |	|-- i18n
    |   |-- images
    |   |-- orders
    |   |-- registration
    |   |-- reports
    |
    |-- .jshint.rc
    |-- package.json
</pre>
