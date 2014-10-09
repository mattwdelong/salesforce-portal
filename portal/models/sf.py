import os
from simple_salesforce import Salesforce
from portal import app


FIELDS = """Id, Name, FirstName, LastName, Email, Contact_Type__c, HomePhone,
            MobilePhone, Phone, MailingStreet, MailingCity, MailingPostalCode,
            Gender__c, Marital_Status__c, Salvation__c, IsBaptised__c,
            RecordType.Name, isKeyLeader__c, Partner__c"""

class SFPerson(object):
    def __init__(self):
        self.connection = self.login()

    def login(self):
        sandbox = os.environ.get('SF_SANDBOX', False)

        return Salesforce(
            username=os.environ['SF_USERNAME'],
            password=os.environ['SF_PASSWORD'],
            security_token=os.environ['SF_TOKEN'],
            sandbox=sandbox
        )

    def get_all(self, more=None):
        """
        Get all the contacts from Salesforce
        """
        if not more:
            soql = """
                select %s
                from Contact
                order by lastName, firstName
            """ % FIELDS
            results = self.connection.query(soql)
            return results

    def find(self, name):
        """
        Search for contacts by name.
        """
        soql = """
            select %s
            from Contact
            where name like '%%%s%%'
            order by lastName, firstName
        """ % (FIELDS, name)
        results = self.connection.query(soql)
        return results

    def person_by_id(self, sf_id):
        """
        Get the Salesforce person from their ID
        """
        result = self.connection.Contact.get(sf_id)

        small_groups = self.connection.query("""
              select Id, Name, Leader__c, Life_Group__r.Name
              from ContactLifeGroup__c
              where Life_Group__r.Active__c=true
              and Contact__c='%s'""" % sf_id)

        return result, small_groups
