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
    start = db.DateTimeProperty(auto_now=True)

class Projects(db.Model):
    name = db.StringProperty()

class JobHours(db.Model):
    name = db.StringProperty()
    hours = db.DateTimeProperty()
    descr = db.StringProperty()
    project = db.ReferenceProperty(Projects)
    started = db.IntegerProperty()
    counter = db.ReferenceProperty(Counter)

    def start(self):
        c = self.counter
        new = False
        if not c:
            c = Counter()
            new = True

        c.start = datetime.datetime.now()
        c.put()
        if new:
            self.counter = c.key()

        self.started = 1
        self.put()

    def stop(self):
        td = datetime.datetime.now() - self.counter.start
        tmp = self.hours + td
        self.hours = tmp.replace(microsecond = 0)
        self.started = 0
        self.put()

    def restart(self):
        self.stop()
        self.start()

    def getHours(self):
        return getHours(self.hours)

    def delete(self):
        db.delete(self.counter.key())
        db.delete(self.key())

class DataJobHours():
    name = ''
    hours = 0
    descr = ''
    project = ''
    started = ''
    def __init__(self,jh):
        self.name = jh.name
        self.hours = jh.getHours()
        self.descr = jh.descr
        self.project = jh.project.name
        if jh.started==1:
            self.started='stop'
        else:
            self.started='start'


def getHours(hours):
    td = hours - datetime.datetime.min
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
