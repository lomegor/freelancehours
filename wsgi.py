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

import webapp2
from freelancehours.handlers import MainPage
from freelancehours.handlers import API

app = webapp2.WSGIApplication([(r'^/$', MainPage),
                               (r'/(.*)/(.*)', API)],
                               debug=True)