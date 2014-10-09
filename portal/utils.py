from flask import request
from portal import app


def is_testing():
    if request.args.get('testing'):
        return True
    else:
        return False
