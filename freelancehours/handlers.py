# -*- coding: utf-8 -*-
# Copyright 2012 Sebastian Ventura, Jose Moreira
# This file is part of freelancehours.
#
# freelancehours is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# frelancehours is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with freelancehours.  If not, see <http://www.gnu.org/licenses/>.

import logging
import os
import datetime
import urllib
import webapp2

from google.appengine.api import users
from google.appengine.ext.webapp import template
from google.appengine.ext import db

from models import Counter
from models import DailyHours
from models import DataJobHours
from models import DataDailyHours
from models import getHours
from models import Projects
from models import JobHours

class MainPage(webapp2.RequestHandler):

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
            'current_user': users.get_current_user(),
            'logout_url': users.create_logout_url('/')
            }
        path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'index.html')
        self.response.out.write(template.render(path, template_values))

class API(webapp2.RequestHandler):
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


def Respond(req, error, msg):
    req.response.out.write("{\"error\":"+str(error)+",\"data\":\""+str(msg)+"\"}")
