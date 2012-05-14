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

class DataJobHours():
    name = ''
    hours = 0
    project = ''
    def __init__(self,jh):
        self.name = jh.name
        self.hours = jh.hours
        self.project = jh.project.name

class JobHours(db.Model,webapp.RequestHandler):
    name = db.StringProperty()
    hours = db.FloatProperty()

    def get(self,n=''):
        method = self.request.get('method')
        jh = JobHours.all().filter('name =',n).get()
        if (method=='update'):
            hours = self.request.get('hours')
            jh.hours=hours
            jh.put()
        elif (method=='delete'): 
            db.delete(jh.key())
        else:
            self.response.out.write(jh.hours)

    def post(self):
        jh = JobHours(name=self.request.get('name'),hours=0.0)
        jh.put()

application = webapp.WSGIApplication([('/', MainPage),
                                      ('/jh/', JobHours)],
                                     debug=True)

def main():
    run_wsgi_app(application)

if __name__ == "__main__":
    main()
