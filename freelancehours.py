import logging
import cgi
import os
import datetime
import urllib
import sys


from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template
from google.appengine.ext import db

class MainPage(webapp.RequestHandler):

    def get(self):
        dataHours = []
        projects = []

        cs = Counter.all()
        for c in cs:
            jh = JobHours.all().filter('name =',c.name).get()
            td = datetime.datetime.now()-c.start
            tmp = datetime.datetime.combine(datetime.date.today(), jh.hours) + td
            tmp = tmp.time()

            jh.hours = tmp.replace(microsecond = 0)
            jh.put()

            c.start = datetime.datetime.now()
            c.put()

        for j in JobHours.all():
            dataHours.append(DataJobHours(j))

        for p in Projects.all():
            projects.append(p.name)

        template_values = {
            'projects':projects,
            'hours':dataHours
        }

        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, template_values))

class Counter(db.Model):
    name = db.StringProperty()
    start = db.DateTimeProperty(auto_now=True)

class DataJobHours():
    name = ''
    hours = 0
    descr = ''
    project = ''
    started = ''
    def __init__(self,jh):
        self.name = jh.name
        self.hours = jh.hours.isoformat()
        self.descr = jh.descr
        self.project = jh.project.name
        if jh.started==1:
            self.started='stop'
        else:
            self.started='start'

class Projects(db.Model):
    name = db.StringProperty()

class JobHours(db.Model):
    name = db.StringProperty()
    hours = db.TimeProperty()
    descr = db.StringProperty()
    project = db.ReferenceProperty(Projects)
    started = db.IntegerProperty()

class API(webapp.RequestHandler):
    def get(self,p='',n=''):
        try:
            p = urllib.unquote(p)
            n = urllib.unquote(n)

            pj = Projects.all().filter('name =',p).get()
            if not pj:
                pj = Projects(name = p)
                pj.put()

            new = False
            jh = pj.jobhours_set.filter('name =',n).get()
            if not jh:
                descr = self.request.get('descr')
                jh = JobHours(name = n, hours = datetime.time(), descr = descr, project = pj.key())
                jh.put()
                new = True

            method = self.request.get('method')
            if method == 'update':
                hours = self.request.get('hours')
                jh.hours = hours
                jh.put()
                Respond(self,0,"");
            elif method == 'delete':
                c = Counter.all().filter('name =',n)
                for c1 in c:
                    db.delete(c1.key())
                db.delete(jh.key())
                Respond(self,0,"");
            elif method == 'start':
                c = Counter.all().filter('name =',n)
                for c1 in c:
                    db.delete(c1.key())
                c = Counter()
                c.name = n
                c.put()
                jh = JobHours.all().filter('name =',n).get()
                jh.started=1
                jh.put()
                Respond(self,0,"");
            elif method == 'stop':
                c = Counter.all().filter('name =',n).get()
                if c!=None:
                    jh = JobHours.all().filter('name =',n).get()
                    jh.started=0
                    td = datetime.datetime.now()-c.start
                    tmp = datetime.datetime.combine(datetime.date.today(), jh.hours) + td
                    tmp = tmp.time()
                    jh.hours = tmp.replace(microsecond = 0)
                    jh.put()
                    c = Counter.all().filter('name =',n)
                    for c1 in c:
                        db.delete(c1.key())
                    Respond(self,0,jh.hours.isoformat())
            elif new:
                Respond(self,0,jh.hours.isoformat())
            else:
                Respond(self,1,"Task already exists!");
        except:
            Respond(self,1,"Unexpected error!")
            logging.exception("Error")

def Respond(req, error, msg):
    req.response.out.write("{\"error\":"+str(error)+",\"data\":\""+str(msg)+"\"}")

application = webapp.WSGIApplication([(r'^/$', MainPage),
                                      (r'/(.*)/(.*)', API)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
