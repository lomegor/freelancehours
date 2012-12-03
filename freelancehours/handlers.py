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
from models import getHours
from models import Projects
from models import JobHours
from models import DataJobHours

class MainPage(webapp2.RequestHandler):

    def get(self):
        dataHours = []
        projects = []
        dailyHours = dict()

        for p in Projects.all():
            dailyHours[p.name] = datetime.datetime.min
            projects.append(p.name)

        for j in JobHours.all():
            if j.started:
                j.restart()
            dataHours.append(DataJobHours(j))
            tmp = j.hours - datetime.datetime.min
            dailyHours[j.project.name] += tmp

        hoursArray = []
        for k,v in dailyHours.iteritems():
            v = getHours(v)
            hoursArray.append([k,v])

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
            if method == 'delete':
                jh.delete()
                Respond(self,0,"");
            elif method == 'start':
                jh.start()
                Respond(self,0,"");
            elif method == 'stop':
                jh.stop()
                Respond(self,0,jh.getHours())
            elif new:
                Respond(self,0,jh.getHours())
            else:
                Respond(self,1,"Task already exists!");
        except:
            Respond(self,1,"Unexpected error!")
            logging.exception("Error")

def Respond(req, error, msg):
    req.response.out.write("{\"error\":"+str(error)+",\"data\":\""+str(msg)+"\"}")

