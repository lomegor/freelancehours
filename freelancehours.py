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
        dailyHours = dict()

        cs = Counter.all()
        for c in cs:
            jh = JobHours.all().filter('name =',c.name).get()
            td = datetime.datetime.now()-c.start
            tmp = jh.hours + td

            jh.hours = tmp.replace(microsecond = 0)
            jh.put()

            d = DailyHours.all().filter('day =',datetime.date.today())\
                .filter('project =',jh.project.key()).get();
            if not d:
                d = DailyHours(project = jh.project.key(), day = datetime.date.today())
                tmp = datetime.datetime.min + td
            else:
                tmp = d.hours + td
            d.hours = tmp.replace(microsecond = 0)
            d.put()

            c.start = datetime.datetime.now()
            c.put()

        for p in Projects.all():
            dailyHours[p.name] = dict(total=datetime.datetime.min, hours=[])
            projects.append(p.name)

        for j in JobHours.all():
            dataHours.append(DataJobHours(j))
            tmp = j.hours - datetime.datetime.min
            dailyHours[j.project.name]['total'] += tmp

        for d in DailyHours.all():
            dailyHours[d.project.name]['hours'].append(DataDailyHours(d))

        hoursArray = []
        for k,v in dailyHours.iteritems():
            total = DataDailyHours()
            total.hours = v['total']
            v['total'] = getHours(total)
            hoursArray.append([k,v['total'],v['hours']])

        template_values = {
            'projects':projects,
            'hours':dataHours,
            'daily':hoursArray,
        }

        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, template_values))

class Counter(db.Model):
    name = db.StringProperty()
    start = db.DateTimeProperty(auto_now=True)

class DataDailyHours():
    project = ''
    day = ''
    hours = ''
    today = ''
    def __init__(self,dh=None):
        if dh:
            self.project = dh.project.name
            self.day = dh.day.isoformat()
            if dh.day == datetime.date.today():
                self.today = 'today'
            self.hours = getHours(dh)

class DataJobHours():
    name = ''
    hours = 0
    descr = ''
    project = ''
    started = ''
    def __init__(self,jh):
        self.name = jh.name
        self.hours = getHours(jh)
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
    hours = db.DateTimeProperty()
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
                jh = JobHours(name = n,\
                    hours = datetime.datetime.min,\
                    descr = descr, project = pj.key())
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
                    tmp = jh.hours + td

                    jh.hours = tmp.replace(microsecond = 0)
                    jh.put()

                    d = DailyHours.all().filter('day =',datetime.date.today())\
                        .filter('project =',jh.project.key()).get();
                    if not d:
                        d = DailyHours(project = jh.project.key(), day = datetime.date.today())
                        tmp = datetime.datetime.min + td
                    else:
                        tmp = d.hours + td
                    d.hours = tmp.replace(microsecond = 0)
                    d.put()

                    c = Counter.all().filter('name =',n)
                    for c1 in c:
                        db.delete(c1.key())
                    Respond(self,0,getHours(jh))
            elif new:
                Respond(self,0,getHours(jh))
            else:
                Respond(self,1,"Task already exists!");
        except:
            Respond(self,1,"Unexpected error!")
            logging.exception("Error")

class DailyHours(db.Model):
    project = db.ReferenceProperty(Projects)
    day = db.DateProperty()
    hours = db.DateTimeProperty()

def Respond(req, error, msg):
    req.response.out.write("{\"error\":"+str(error)+",\"data\":\""+str(msg)+"\"}")

def getHours(o):
    td = o.hours - datetime.datetime.min
    td = (td.microseconds + (td.seconds + td.days * 24 * 3600)\
        * 10**6) / 10**6
    h = int(td/3600)
    td = td - (h*3600)
    m = int(td/60)
    s = td - (m*60)
    if h<10:
        h="0"+str(h)
    if m<10:
        m="0"+str(m)
    if s<10:
        s="0"+str(s)
    return str(h)+":"+str(m)+":"+str(s)

application = webapp.WSGIApplication([(r'^/$', MainPage),
                                      (r'/(.*)/(.*)', API)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
