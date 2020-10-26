import axios from "axios";

// 액션타입
const ROOM_IN = "ROOM_IN";
const ROOM_OUT = "ROOM_OUT";

//초기값
const initialState = {
  room: {
    title: "",
    gametype: "",
    peoplemaxnum: -1,
    roomid: 0,
  },
};

//액션 생성함수
export const roomin = (roomid) => {
  return {
    type: ROOM_IN,
    roomid,
  };
};

export const roomout = () => {
  return {
    type: ROOM_OUT,
  };
};

//thunk (middleware)
export const roomCreateRequest = (title, password, gametype, peoplemaxnum) => (
  dispatch
) => {
  //방 만들면 방번호 서버에서 리턴해줘야됨
  return axios({
    method: "POST",
    url: "http://localhost:5000/roomnumber",
    data: {
      title,
      password,
      gametype,
      peoplemaxnum,
    },
  }).then((res) => {
    console.log("서버에서 방정보를 받아왔습니다");
    return dispatch(roomin(res.data.roomid));
  });
};

export const roomInRequest = (roomid) => (dispatch) => {
  return axios({
    method: "POST",
    url: "",
    data: {
      roomid,
    },
  });
};

//리듀서
const room = (state = initialState, action) => {
  switch (action.type) {
    case ROOM_IN:
      return {
        ...state,
        room: {
          roomid: action.roomid,
        },
      };
    case ROOM_OUT:
      return {
        ...state,
        room: {
          title: "",
          gametype: "",
          peoplemaxnum: -1,
          roomid: 0,
        },
      };
    default:
      return state;
  }
};

export default room;