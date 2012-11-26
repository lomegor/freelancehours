# Makefile for this site
#
#
LESSC="./node_modules/less/bin/lessc"

assets-compile:
	${LESSC} assets/less/main.less > static/styles/main.css
	${LESSC} assets/less/main-responsive.less > static/styles/main-responsive.css

assets-compress:
	${LESSC} --compress assets/less/main.less > static/styles/main.css
	${LESSC} --compress assets/less/main-responsive.less > static/styles/main-responsive.css

watch-assets:
	echo "Watching less files..."; \
	${WATCHR} -e "watch('src/less/.*\.less') { system 'make assets' }"

deploy: assets-compress
	appcfg.py update .

run:  assets-compile
	dev_appserver.py --use_sqlite .



