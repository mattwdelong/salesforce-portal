import datetime
import os
from flask import session
from simple_salesforce import Salesforce
from portal import app


FIELDS = """Id, Name, FirstName, LastName, Email, Contact_Type__c, HomePhone,
            MobilePhone, Phone, MailingStreet, MailingCity, MailingPostalCode,
            Gender__c, Marital_Status__c, Salvation__c, IsBaptised__c,
            RecordType.Name, isKeyLeader__c, Partner__c"""


class SFObject(object):
    def __init__(self):
        self.connection = self.login()
        self.record_type = {}

    def login(self):
        sandbox = os.environ.get('SF_SANDBOX', False)

        return Salesforce(
            username=os.environ['SF_USERNAME'],
            password=os.environ['SF_PASSWORD'],
            security_token=os.environ['SF_TOKEN'],
            sandbox=sandbox
        )


class SFPerson(SFObject):
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
        result["RecordTypeName"] = self.get_record_type(result["RecordTypeId"])

        small_groups = self.person_small_groups(sf_id)
        team_permissions = self.person_team_serving_permissions(sf_id)

        # Get the list of teams the current user can manage
        manageable_teams = self.person_team_serving_permissions(
            session['user_id'])
        manageable_teams = [t["team_id"] for t in manageable_teams if t["access_manage"]]
        teams = self.person_team_serving(sf_id, manageable_teams)

        return result, small_groups, teams, team_permissions

    def person_small_groups(self, sf_id):
        """
        Get the list of small groups and mark the ones that the person is a
        part of.
        """
        # Full list of small groups
        groups = self.connection.query("""
              select Id, Name from Life_Group__c
              where Active__c=true
              order by Name""")

        # Small groups that the person is a member of
        in_small_groups = self.connection.query("""
              select Id, Name, Leader__c, Life_Group__r.Id
              from ContactLifeGroup__c
              where Life_Group__r.Active__c=true
              and Contact__c='%s'""" % sf_id)

        # Generate a single list with the information
        small_groups = []
        for sg in groups["records"]:
            group = {
                "group_id": sg["Id"],
                "group_name": sg["Name"],
                "in_group": False,
                "leader": False,
            }
            # Check to see if the person is in this group
            for isg in in_small_groups["records"]:
                if sg["Id"] == isg["Life_Group__r"]["Id"]:
                    group.update({
                        "in_group": True,
                        "leader": isg["Leader__c"],
                    })
                    continue
            small_groups.append(group)

        return small_groups

    def get_record_type(self, sf_id):
        """
        Get the record type name from the Id, caching the result
        """
        if not self.record_type.get(sf_id):
            result = self.connection.RecordType.get(sf_id)
            self.record_type[result["Id"]] = result["Name"]
        return self.record_type.get(sf_id)

    def person_team_serving(self, sf_id, manageable_teams):
        """
        Get the teams that a person is serving in and identify the ones that
        the user has permissions to manage.
        """
        # Full list of active teams
        teams = self.connection.query("""
              select Id, Name from Team__c
              where IsActive__c=true
              order by Name""")

        in_teams = self.connection.query("""
              select Id, Name, Team__r.Id, Access__c
              from ContactTeamLink__c
              where Team__r.IsActive__c=true
              and Contact__c='%s'""" % sf_id)

        team_list = []
        for ts in teams["records"]:
            team = {
                "team_id": ts["Id"],
                "team_name": ts["Name"],
                "in_team": False,
                "access_contact": False,
                "access_manage": False,
            }
            for ct in in_teams["records"]:
                if ts["Id"] == ct["Team__r"]["Id"]:
                    team["in_team"] = True
                    if ct["Team__r"]["Id"] in manageable_teams:
                        team["access_manage"] = True
            team_list.append(team)

        return team_list

    def person_team_serving_permissions(self, sf_id):
        """
        Get the teams that a person has permissions over.
        """
        # Full list of active teams
        teams = self.connection.query("""
              select Id, Name from Team__c
              where IsActive__c=true
              order by Name""")

        in_teams = self.connection.query("""
              select Id, Name, Team__r.Id, Access__c
              from Contact_PortalGroup_Link__c
              where Team__r.IsActive__c=true
              and Contact__c='%s'""" % sf_id)

        team_list = []
        for ts in teams["records"]:
            team = {
                "team_id": ts["Id"],
                "team_name": ts["Name"],
                "in_team": False,
                "access_contact": False,
                "access_manage": False,
            }
            for ct in in_teams["records"]:
                if ts["Id"] == ct["Team__r"]["Id"]:
                    team["in_team"] = True
                    if ct["Access__c"] == "Manage":
                        team["access_manage"] = True
                    if ct["Access__c"] == "Contact Only":
                        team["access_contact"] = True
            team_list.append(team)

        return team_list

    def person_team_serving_update(self, contact_id, team_id):
        """
        Toggle the access and membership of a team.
        None => Member => ...
        """
        team = {
            "in_team": True,
            "access_contact": False,
            "access_manage": False
        }

        # Get the current team membership
        in_team = self.connection.query("""
              select Id, Name, Team__r.Id, Access__c
              from ContactTeamLink__c
              where Team__r.IsActive__c=true
              and Contact__c='%s' and Team__r.Id='%s'""" %
                                        (contact_id, team_id))

        if len(in_team["records"]) > 0:
            membership = in_team["records"][0]
            # Remove membership
            self.connection.ContactTeamLink__c.delete(membership["Id"])
            team["in_team"] = False
        else:
            # Add membership
            sf_record = {
                'Contact__c': contact_id,
                'Team__c': team_id,
                "Access__c": "",
            }
            self.connection.ContactTeamLink__c.create(sf_record)
            team["access"] = True

        return team

    def person_team_permissions_update(self, contact_id, team_id):
        """
        Toggle the access and membership of a team.
        None => Contact-Only => Manage => ...
        """
        team = {
            "in_team": True,
            "access_contact": False,
            "access_manage": False
        }

        # Get the current team membership
        in_team = self.connection.query("""
              select Id, Name, Team__r.Id, Access__c
              from Contact_PortalGroup_Link__c
              where Team__r.IsActive__c=true
              and Contact__c='%s' and Team__r.Id='%s'""" %
                                        (contact_id, team_id))

        if len(in_team["records"]) > 0:
            membership = in_team["records"][0]
            if membership["Access__c"] == "Manage":
                # Remove membership
                self.connection.Contact_PortalGroup_Link__c.delete(membership["Id"])
                team["in_team"] = False
            elif membership["Access__c"] == "Contact Only":
                # Allow to manage
                sf_record = {
                    "Access__c": "Manage"
                }
                self.connection.Contact_PortalGroup_Link__c.update(
                    membership["Id"], sf_record)
                team["access_manage"] = True
            else:
                # Allow to contact
                sf_record = {
                    "Access__c": "Contact Only"
                }
                self.connection.Contact_PortalGroup_Link__c.update(
                    membership["Id"], sf_record)
                team["access_contact"] = True
        else:
            # Add membership
            sf_record = {
                'Contact__c': contact_id,
                'Team__c': team_id,
                "Access__c": "Contact Only",
            }
            self.connection.Contact_PortalGroup_Link__c.create(sf_record)
            team["access"] = True

        return team

    def person_small_group_update(self, contact_id, group_id):
        """
        Toggle the membership and access of the small group.
        None => Member => Leader => ...
        """
        small_group = {
            "in_group": True,
            "leader": False,
        }

        # Get the current team membership
        in_small_groups = self.connection.query("""
              select Id, Name, Leader__c, Life_Group__r.Id
              from ContactLifeGroup__c
              where Life_Group__r.Active__c=true
              and Contact__c='%s' and Life_Group__r.Id='%s'""" %
                                                (contact_id, group_id))

        if len(in_small_groups["records"]) > 0:
            membership = in_small_groups["records"][0]
            if membership["Leader__c"]:
                # Remove membership
                self.connection.ContactLifeGroup__c.delete(membership["Id"])
                small_group["in_group"] = False
            else:
                # Make leader
                sf_record = {"Leader__c": True}
                self.connection.ContactLifeGroup__c.update(
                    membership["Id"], sf_record)
                small_group["leader"] = True
        else:
            # Add membership
            sf_record = {
                'Contact__c': contact_id,
                'Life_Group__c': group_id,
                "Leader__c": False,
            }
            self.connection.ContactLifeGroup__c.create(sf_record)

        return small_group

    def user_by_email(self, email):
        """
        Get the user by the Email address.
        """
        people = self.connection.query("""
            select Id, Portal_Google_Account__c, Portal_Role__c, Name
            from Contact
            where Portal_Google_Account__c = '%s'
        """ % email)
        if len(people["records"]) > 0:
            return people["records"][0]
        else:
            return

    def update_last_login(self, user_id):
        """
        Update the last login time for the user.
        """
        now = datetime.datetime.utcnow()
        self.connection.Contact.update(
            user_id,
            {"Portal_Last_Login__c": now.strftime("%Y-%m-%dT%H:%M:%S")})


class SFContact(SFObject):
    def teams(self):
        """
        Get the teams and permissions for the current user.
        """
        if session['role'] == "Admin":
            # Get all the teams
            soql = """
                select Id, Name, TrackAttenders__c from Team__c
                where Team__c.IsActive__c=true
            """
        else:
            soql = """
                select Id, Name, Access__c, Team__r.Id, Team__r.Name, Team__r.TrackAttenders__c
                from ContactTeamLink__c
                where Team__r.IsActive__c=true
                and Contact__c = '%s'
            """ % session['user_id']
        teams = self.connection.query(soql)

        records = []
        for t in teams["records"]:
            if session['role'] == "Admin":
                record = {
                    "Id": t["Id"],
                    "Name": t["Name"],
                    "Access": "Manage",
                    "TrackAttenders": t["TrackAttenders__c"],
                    "Selected": False,
                }
            else:
                record = {
                    "Id": t["Team__r"]["Id"],
                    "Name": t["Team__r"]["Name"],
                    "Access": t["Access__c"],
                    "TrackAttenders": t["Team__r"]["TrackAttenders__c"],
                    "Selected": False,
                }
            records.append(record)

        return records

    def small_groups(self):
        """
        Get the small groups based on the user's permissions.
        """
        if session['role'] == "Admin":
            soql = """
                select Id, Name from Life_Group__c
                where Active__c=true
            """
        else:
            soql = """
                select Id,Leader__c, Life_Group__r.Id, Life_Group__r.Name
                from ContactLifeGroup__c
                where Life_Group__r.Active__c=true
                and Contact__c = '%s'
            """ % session['user_id']
        groups = self.connection.query(soql)

        records = []
        for g in groups["records"]:
            if session['role'] == "Admin":
                record = {
                    "Id": g["Id"],
                    "Name": g["Name"],
                    "Leader": True,
                }
            else:
                record = {
                    "Id": g["Life_Group__r"]["Id"],
                    "Name": g["Life_Group__r"]["Name"],
                    "Leader": g["Leader__c"],
                }
            records.append(record)

        return records

    def team_members(self, team_id):
        """
        Get the members of the team.
        """
        soql = """
            select Contact__r.Id, Contact__r.Name, Contact__r.Email
            from ContactTeamLink__c
            where Team__r.IsActive__c=true
            and Team__r.Id = '%s'
        """ % team_id
        teams = self.connection.query(soql)

        members = []
        for t in teams["records"]:
            members.append({
                "Id": t["Contact__r"]["Id"],
                "Name": t["Contact__r"]["Name"],
                "Email": t["Contact__r"]["Email"],
            })

        return members

    def small_group_members(self, small_group_id):
        """
        Get the members of the small group.
        """
        soql = """
            select Contact__r.Id, Contact__r.Name, Contact__r.Email
            from ContactLifeGroup__c
            where Life_Group__r.Active__c=true
            and Life_Group__r.Id = '%s'
        """ % small_group_id
        groups = self.connection.query(soql)

        members = []
        for t in groups["records"]:
            members.append({
                "Id": t["Contact__r"]["Id"],
                "Name": t["Contact__r"]["Name"],
                "Email": t["Contact__r"]["Email"],
            })

        return members
