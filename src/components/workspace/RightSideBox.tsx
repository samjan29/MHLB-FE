import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import styled from "styled-components";
import { getPeopleList } from "../../api/rightSide";
import { getCookie } from "../../cookie/cookies";
import MembersBox from "./MembersBox";
import { EventSourcePolyfill } from "event-source-polyfill";
import MessageBox from "./MessageBox";
import Chat from "./Chat";
import { useParams } from "react-router-dom";

export interface MemberDataType {
  userId: number,
  userImage: string,
  userName: string,
  userJob: string,
  userEmail: string,
  status: string,
  color: number,
  description: string
};
interface SetUSerDataType {
  isChat: boolean,
  userId: number,
  userName: string,
  uuid: string,
  userImage: string,
  color: number,
  checkPersonInbox: boolean,
  toggle: boolean
};

function RightSideBox() {
  const params = useParams();

  const { isLoading: isLoadingPeopleData, data : peopleListData } = useQuery('peopleList', () => getPeopleList(Number(params.workspaceId)));

  const [toggle, setToggle] = useState(false);
  const [member, setMember] = useState<any>([]);

  const [statusArr, setStatusArr] = useState<any>();
  const [peopleArr, setPeopleArr] = useState<any>([]);

  const [isChat, setIsChat] = useState(false); // 사람 클릭시, 채팅방 클릭시 채팅방으로 이동
  const [userId, setUserId] = useState<number>(); // 채팅방 id <Chat /> 에 넘겨주기
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userJob, setUserJob] = useState('');
  const [color, setColor] = useState<number>();

  const [uuid, setUuid] = useState('');
  const [checkPersonInbox, setCheckPersonInbox] = useState(true);

  useEffect(() => {
    if(peopleListData) setPeopleArr(peopleListData);
  }, [peopleListData, isLoadingPeopleData]);


  const EventSource = EventSourcePolyfill;

  useEffect(() => {
    const eventSource = new EventSource(`${process.env.REACT_APP_BE_SERVER}/api/status/${params.workspaceId}/connect`,
      {
        headers: { Authorization: getCookie("authorization")},
        withCredentials: true
      }
    );

    eventSource.addEventListener('connect', (e: any) => { 
      const { data : receiveData } = e;
      // console.log('connect: ', receiveData);
    });
    eventSource.addEventListener('status changed', (e: any) => {
      const { data : statusChangedData } = e;
      // console.log("status changed data : ", statusChangedData);
      setStatusArr(e);
    });
  }, []);

  useEffect(() => {
    if(peopleArr && statusArr) {
      for(let i = 0; i < peopleArr.length; i++) {
        if(peopleArr[i].userId === statusArr.userId) {
          peopleArr[i].status = statusArr.status;
          peopleArr[i].color = statusArr.color;
        }
      }
    }
    const currentUser = peopleArr[0];
    const tempArr = peopleArr.slice(1);
    tempArr.sort((a:MemberDataType, b:MemberDataType) => {
      if(a.userName > b.userName) return 1;
      if(a.userName < b.userName) return -1;
    }).sort((a: MemberDataType, b: MemberDataType) => {
      if(a.color > b.color) return 1;
      if(a.color < b.color) return -1;
    }).unshift(currentUser);
    setMember(tempArr);
  }, [peopleArr, statusArr]);

  const onClickMemberHandler = () => {
    setToggle(false);
    setIsChat(false);
  };
  const onClickInboxHandler = () => {
    setToggle(true);
    setIsChat(false);
  };
  // 바뀐 status을 배열에 적용

  useEffect(() => {
    setMember(peopleArr);
  }, [peopleArr]);

  const peopleData = ({isChat, userId, userName, toggle, checkPersonInbox, userJob, userImage, color}:{search:string, isChat:boolean, userId:number|undefined,userName:string,toggle:boolean,checkPersonInbox:boolean,userJob:string,userImage:string,color:number|undefined}) => {
    setIsChat(isChat)
    setUserId(userId)
    setToggle(toggle)
    setCheckPersonInbox(checkPersonInbox)
    setUserName(userName)
    setUserJob(userJob)
    setUserImage(userImage)
    setColor(color)
  };

  const searchMember = (search : string) => {
    setMember(peopleArr.filter((item: MemberDataType)=>item?.userName.toLowerCase().includes(search?.toLowerCase())));
  };
  const setUserData = ({isChat, userId, userName, userImage, color, uuid, checkPersonInbox, toggle}:SetUSerDataType) => {
    setIsChat(isChat);
    setUserId(userId);
    setUserName(userName);
    setUserImage(userImage);
    setUuid(uuid);
    setColor(color);
    setToggle(toggle);
    setCheckPersonInbox(checkPersonInbox);
  };

  // 배경 스크롤 막기
  const onMouseOverRightSideBox = () => {
    document.body.style.cssText = `
      position: fixed;
      top: -${window.scrollY}px;
      width: 100%;
      overflow-y: scroll;
    `
  };
  const onMouseOutRightSideBox = () => {
    const scrollY = document.body.style.top;
    document.body.style.cssText = '';
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
  };
 
  return (
    <StContainer onMouseOver={onMouseOverRightSideBox} onMouseOut={onMouseOutRightSideBox}>
      <StSelectBox>
        { toggle ? <StMember onClick={onClickMemberHandler} >멤버</StMember> : <StMemberTrue>멤버</StMemberTrue> }
        { toggle ? <StInboxTrue>인박스</StInboxTrue> : <StInbox onClick={onClickInboxHandler} >인박스</StInbox>}
      </StSelectBox>
      {
        isChat
          ?
          <StChatBox>
            <Chat userId={userId} uuid={uuid} checkPersonInbox={checkPersonInbox} userName={userName} userJob={userJob} userImage={userImage} color={Number(color)} workspaceId={Number(params.workspaceId)} setToggle={v=>setToggle(v)} setIsChat={v=>setIsChat(v)} />
          </StChatBox>
          :
          <>
          {
            toggle 
              ?
              <StMessageListBox>
                <MessageBox 
                  workspaceId={Number(params.workspaceId)}
                  setUserData={setUserData}
                />
              </StMessageListBox>
              :
              <StPeopleListBox>
                <MembersBox 
                  member={member}
                  searchMember={searchMember}
                  peopleData={peopleData}
                />
              </StPeopleListBox>
          }
          </>
      }
    </StContainer>
  )
}

export default RightSideBox;

const StContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const StSelectBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 36px;
  padding: 32px 0px 0px 0px;
`;

const StChatBox = styled.div`
  height:92%;
`;

const StMemberTrue = styled.h3`
  color: #007AFF;
  border-bottom: 2px solid #007AFF;
  cursor: pointer;
`;
const StMember = styled.h3`
  cursor: pointer;
`;
const StInboxTrue = styled.h3`
  color: #007AFF;
  border-bottom: 2px solid #007AFF;
  cursor: pointer;
`;
const StInbox = styled.h3`
  cursor: pointer;
`;

const StPeopleListBox = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
`;

const StMessageListBox = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  box-sizing: border-box;
  justify-content: center;
  align-items: center;
`;