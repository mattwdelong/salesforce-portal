#!/usr/bin/env python
import os
import sys


IP = os.environ.get('OPENSHIFT_PYTHON_IP', 'localhost')
PORT = int(os.environ.get('OPENSHIFT_PYTHON_PORT', 8080))

from portal import app as application


if __name__ == '__main__':
    application.run(IP, PORT)
