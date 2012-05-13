import cgi
import os
import datetime


from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template
from google.appengine.ext import db
       
class MainPage(webapp.RequestHandler):
    def get(self):
        dataHours = []
        for j in JobHours.all():
            dataHours.append(DataJobHours(j))

        template_values = {
                'hours':dataHours
        }
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, template_values))

    def post(self):
        jh = JobHours(name =self.request.get('name'),hours=0.0,started=0)
        jh.put()
        self.redirect('/')

class DataJobHours():
    name = ''
    hours = 0
    started = 'start'
    def __init__(self,jh):
        self.name = jh.name
        self.hours = jh.hours
        if jh.started==1:
            self.started='stop'
        else:
            self.started='start'

class Counter(db.Model):
    name = db.StringProperty()
    start = db.DateTimeProperty(auto_now=True)

class JobHours(db.Model,webapp.RequestHandler):
    name = db.StringProperty()
    hours = db.FloatProperty()
    started = db.IntegerProperty()
    def get(self,n=''):
        method = self.request.get('method')
        if method=='get':
            jh = JobHours.all().filter('name =',n).get()
            self.response.out.write(jh.hours)
        elif (method=='start'):
            c = Counter.all().filter('name =',n)
            for c1 in c:
                db.delete(c1.key())
            c = Counter()
            c.name = n
            c.put()
            jh = JobHours.all().filter('name =',n).get()
            jh.started=1
            jh.put()
        elif (method=='stop'):
            c = Counter.all().filter('name =',n).get()
            if c!=None:
                jh = JobHours.all().filter('name =',n).get()
                jh.started=0
                td = datetime.datetime.now()-c.start
                jh.hours+=float((td.microseconds + (td.seconds + td.days * 24 * 3600) * 10**6) / 10**6)/60/60
                jh.put()
        elif (method=='increment'):
            jh = JobHours.all().filter('name =',n).get()
            jh.hours+=1
            jh.put()
        elif (method=='decrement'):
            jh = JobHours.all().filter('name =',n).get()
            if jh.hours!=0:
                jh.hours-=1
                jh.put()
        elif (method=='delete'): 
            jh = JobHours.all().filter('name =',n).get()
            db.delete(jh.key())
        
application = webapp.WSGIApplication([('/', MainPage),
                                      ('/insert', MainPage),
                                      ('/jh/(.*)', JobHours)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
