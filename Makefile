# Makefile for this site
#
#
LESSC="./node_modules/less/bin/lessc"
UGLIFY="./node_modules/uglify-js/bin/uglifyjs"

BOOTSTRAP_FILES=vendor/bootstrap/js/bootstrap-transition.js vendor/bootstrap/js/bootstrap-alert.js\
 vendor/bootstrap/js/bootstrap-button.js vendor/bootstrap/js/bootstrap-carousel.js \
 vendor/bootstrap/js/bootstrap-collapse.js vendor/bootstrap/js/bootstrap-dropdown.js \
 vendor/bootstrap/js/bootstrap-modal.js vendor/bootstrap/js/bootstrap-tooltip.js \
 vendor/bootstrap/js/bootstrap-popover.js vendor/bootstrap/js/bootstrap-scrollspy.js \
 vendor/bootstrap/js/bootstrap-tab.js vendor/bootstrap/js/bootstrap-typeahead.js vendor/bootstrap/js/bootstrap-affix.js

# Compile assets for development
assets-compile:
	${LESSC} assets/less/main.less > static/styles/main.css
	${LESSC} assets/less/main-responsive.less > static/styles/main-responsive.css
	${UGLIFY} ${BOOTSTRAP_FILES} assets/scripts/main.js -b > static/scripts/main.js

# Compile and compresss assets for deployment
assets-compress:
	${LESSC} --compress assets/less/main.less > static/styles/main.css
	${LESSC} --compress assets/less/main-responsive.less > static/styles/main-responsive.css
	${UGLIFY} ${BOOTSTRAP_FILES} assets/scripts/main.js > static/scripts/main.js

deploy: assets-compress
	appcfg.py update .

run:  assets-compile
	dev_appserver.py --use_sqlite .



