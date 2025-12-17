## Collection one: Users

{  
&ensp;  _id: MongoDB ObjectID  
&ensp;  email: String  
&ensp;  password_hash: String  
&ensp;  committee_Memberships: \[String Array\]  
&ensp;  phone_number: String  
&ensp;  short_bio: String  
&ensp;  address: String  
}  


## Collection: Meetings

{  
&ensp;  _id: MongoDB ObjectID  
&ensp;  name: String  
&ensp;  description: String  
&ensp;  datetime: String  
&ensp;  committeeIds: \[Array\]  
&ensp;  createdBy: String       //_id of creating user  
&ensp;  code: String            //Join code  
&ensp;  active: boolean  
&ensp;  participants: \[object array\]  
&ensp;&ensp;    {  
&ensp;&ensp;&ensp;      _id: MongoDB objectID    //_id of user in committee  
&ensp;&ensp;&ensp;      name: String  
&ensp;&ensp;&ensp;      joinedAt: ISO 8601 timestamp  
&ensp;&ensp;&ensp;      uid:    
&ensp;&ensp;    }  
&ensp;  presidingParticipantId: String    //_id of presiding officer  
&ensp;  motions: \[Object Array\]  
&ensp;&ensp;    {  
&ensp;&ensp;&ensp;      _id: MongoDB objectID        //_id of this motion object  
&ensp;&ensp;&ensp;      title: String  
&ensp;&ensp;&ensp;      description: String  
&ensp;&ensp;&ensp;      type: main  
&ensp;&ensp;&ensp;      parentMotionId: String  
&ensp;&ensp;&ensp;      status: String  
&ensp;&ensp;&ensp;      votes:  
&ensp;&ensp;&ensp;&ensp;        {  
&ensp;&ensp;&ensp;&ensp;&ensp;          yes: \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }  
&ensp;&ensp;&ensp;&ensp;&ensp;          no: \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }  
&ensp;&ensp;&ensp;&ensp;&ensp;          abstaint \[Object array\] { participantId: String, participantName: String, timestamp: ISO 8601 timstamp }  
&ensp;&ensp;&ensp;&ensp;        }  
&ensp;&ensp;&ensp;      discussion: \[Object Array\]   
&ensp;&ensp;&ensp;&ensp;        {  
&ensp;&ensp;&ensp;&ensp;&ensp;          _id: MongoDB objectID  
&ensp;&ensp;&ensp;&ensp;&ensp;          participantId: String      //_id of user  
&ensp;&ensp;&ensp;&ensp;&ensp;          participantName: String  
&ensp;&ensp;&ensp;&ensp;&ensp;          comment: String  
&ensp;&ensp;&ensp;&ensp;&ensp;          stance: String            //has value of either pro, con, or neutral  
&ensp;&ensp;&ensp;&ensp;&ensp;          timestamp: ISO 8601 timestamp  
&ensp;&ensp;&ensp;&ensp;        }  
&ensp;&ensp;&ensp;      result: String  
&ensp;&ensp;&ensp;      chairSummary: String  
&ensp;&ensp;&ensp;      pros: \[String Array\]  
&ensp;&ensp;&ensp;      Cons: \[String Array\]    
&ensp;&ensp;&ensp;      votingThreshold: String  
&ensp;&ensp;&ensp;      isAnonymous: boolean  
&ensp;&ensp;&ensp;      createdAt: ISO 8601 timestamp  
&ensp;&ensp;&ensp;      createdBy: String        //_id of creating user  
&ensp;&ensp;&ensp;      id: String               //version of this object's _id  
&ensp;&ensp;    }  
&ensp;  generalDiscussion: \[Array\]  
&ensp;  createdAt: ISO 8601 timestamp  
}  
