## Collection one: Users

{  
  _id: MongoDB ObjectID  
  email: String  
  password_hash: String  
  committee_Memberships: \[String Array\]  
  phone_number: String  
  short_bio: String  
  address: String  
}  


## Collection: Meetings

{
  _id: MongoDB ObjectID
  name: String
  description: String
  datetime: String
  committeeIds: \[Array\]
  createdBy: String       //_id of creating user
  code: String            //Join code
  active: boolean
  participants: \[object array\]
    {
      _id: MongoDB objectID    //_id of user in committee
      name: String
      joinedAt: ISO 8601 timestamp
      uid:
    }
  presidingParticipantId: String    //_id of presiding officer
  motions: \[Object Array\]
    {
      _id: MongoDB objectID        //_id of this motion object
      title: String
      description: String
      type: main
      parentMotionId: String
      status: String
      votes:
        {
          yes: \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }
          no: \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }
          abstaint \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }
        }
      discussion: \[Object Array\] 
        {
          _id: MongoDB objectID
          participantId: String      //_id of user
          participantName: String
          comment: String
          stance: String            //has value of either pro, con, or neutral
          timestamp: ISO 8601 timestamp
        }
      result: String
      chairSummary: String
      pros: \[String Array\]
      Cons: \[String Array\]
      votingThreshold: String
      isAnonymous: boolean
      createdAt: ISO 8601 timestamp
      createdBy: String        //_id of creating user
      id: String               //version of this object's _id
    }
  generalDiscussion: \[Array\]
  createdAt: ISO 8601 timestamp
}
