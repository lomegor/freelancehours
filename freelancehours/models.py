# -*- coding: utf-8 -*-
# Copyright 2012 Sebastian Ventura
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

import datetime
from google.appengine.ext import db

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

class DailyHours(db.Model):
    project = db.ReferenceProperty(Projects)
    day = db.DateProperty()
    hours = db.DateTimeProperty()


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
