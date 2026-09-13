import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  useParams,
  useNavigate,
} from 'react-router-dom';

import Editor from '@monaco-editor/react';

import {
  roomService,
  submissionService,
  helpRequestService,
} from '../services';

import {
  connectSocket,
  disconnectSocket,
} from '../services/socket';

import {
  LANGUAGES,
  DIFFICULTY_COLORS,
  getInitials,
} from '../utils/constants';

import {
  toast,
} from '../components/ToastContainer';

import ChatPanel
  from '../components/ChatPanel';

import VersionHistory
  from '../components/VersionHistory';

import ReviewPanel
  from '../components/ReviewPanel';

import ContributionPanel
  from '../components/ContributionPanel';


// ============================================================
// ROOM SOCKET EVENTS
// ============================================================

const ROOM_SOCKET_EVENTS = [
  'code:sync',
  'code:update',
  'code:language',
  'user:joined',
  'user:left',
  'room:users',
  'chat:message',
  'typing:start',
  'typing:stop',
  'version:saved',
];


// ============================================================
// REMOVE OLD SOCKET LISTENERS
// ============================================================

const removeRoomSocketListeners =
  (socket) => {

    if (!socket) {
      return;
    }


    ROOM_SOCKET_EVENTS.forEach(
      (eventName) => {

        socket.off(
          eventName
        );

      }
    );
  };


// ============================================================
// ONLINE USER DEDUPLICATION
// ============================================================

const getOnlineUserKey =
  (user) => {

    return (
      user?.userId ||
      user?._id ||
      user?.id ||
      null
    )?.toString();
  };


const getUniqueOnlineUsers =
  (users) => {

    const receivedUsers =
      Array.isArray(users)
        ? users
        : [];


    const seen =
      new Set();


    return receivedUsers.filter(
      (user) => {

        const key =
          getOnlineUserKey(
            user
          );


        if (!key) {
          return false;
        }


        if (
          seen.has(
            key
          )
        ) {
          return false;
        }


        seen.add(
          key
        );


        return true;
      }
    );
  };


// ============================================================
// CHAT MESSAGE DEDUPLICATION
// ============================================================

const getChatSenderKey =
  (message) => {

    const sender =
      message?.sender;


    if (
      sender &&
      typeof sender ===
        'object'
    ) {

      return (
        sender._id ||
        sender.id ||
        message?.senderId ||
        message?.userId ||
        message?.senderName ||
        ''
      ).toString();
    }


    return (
      sender ||
      message?.senderId ||
      message?.userId ||
      message?.senderName ||
      ''
    ).toString();
  };


const getStableChatMessageKey =
  (message) => {

    const id =
      message?._id ||
      message?.id;


    if (id) {

      return `id:${id.toString()}`;
    }


    const createdAt =
      message?.createdAt ||
      message?.timestamp;


    if (!createdAt) {

      return null;
    }


    return [
      'message',

      getChatSenderKey(
        message
      ),

      String(
        createdAt
      ),

      String(
        message?.text ||
        ''
      ),

    ].join(':');
  };


const getTemporaryChatMessageKey =
  (message) => {

    return [
      getChatSenderKey(
        message
      ),

      String(
        message?.text ||
        ''
      ).trim(),

    ].join(':');
  };


const getUniqueChatMessages =
  (messages) => {

    const list =
      Array.isArray(messages)
        ? messages
        : [];


    const seen =
      new Set();


    return list.filter(
      (message) => {

        const key =
          getStableChatMessageKey(
            message
          );


        if (!key) {

          return true;
        }


        if (
          seen.has(
            key
          )
        ) {

          return false;
        }


        seen.add(
          key
        );


        return true;
      }
    );
  };


// ============================================================
// ROOM PAGE
// ============================================================

export default function Room() {

  const {
    roomCode,
  } =
    useParams();


  const navigate =
    useNavigate();


  // ============================================================
  // ROOM STATE
  // ============================================================

  const [
    room,
    setRoom,
  ] =
    useState(null);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    language,
    setLanguage,
  ] =
    useState(
      'python'
    );


  const [
    code,
    setCode,
  ] =
    useState('');


  const [
    stdin,
    setStdin,
  ] =
    useState('');


  const [
    output,
    setOutput,
  ] =
    useState(null);


  const [
    running,
    setRunning,
  ] =
    useState(false);


  // ============================================================
  // COLLABORATION STATE
  // ============================================================

  const [
    onlineUsers,
    setOnlineUsers,
  ] =
    useState([]);


  const [
    chatMessages,
    setChatMessages,
  ] =
    useState([]);


  const [
    versions,
    setVersions,
  ] =
    useState([]);


  const [
    typingUsers,
    setTypingUsers,
  ] =
    useState([]);


  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      'problem'
    );


  // ============================================================
  // HELP REQUEST STATE
  // ============================================================

  const [
    helpRequest,
    setHelpRequest,
  ] =
    useState(null);


  const [
    canFinishHelp,
    setCanFinishHelp,
  ] =
    useState(false);


  const [
    showFinishHelpModal,
    setShowFinishHelpModal,
  ] =
    useState(false);


  const [
    finishingHelp,
    setFinishingHelp,
  ] =
    useState(false);


  const [
    finishForm,
    setFinishForm,
  ] =
    useState({
      issueType:
        'Logic Error',

      problemFound:
        '',

      incorrectLocation:
        '',

      whyWrong:
        '',

      changesMade:
        '',

      solutionExplanation:
        '',
    });


  // ============================================================
  // REFS
  // ============================================================

  const codeRef =
    useRef('');


  const lastSentCode =
    useRef('');


  const contributionBuffer =
    useRef({
      added:
        0,

      deleted:
        0,
    });


  const typingTimeout =
    useRef(null);


  const socketRef =
    useRef(null);


  // Used when backend socket payload does not have _id/createdAt.
  // This blocks the same socket message for a very short time.
  const recentChatEventRef =
    useRef({
      key:
        '',

      receivedAt:
        0,
    });


  // ============================================================
  // LOAD ROOM
  // ============================================================

  useEffect(() => {

    let cancelled =
      false;


    setLoading(
      true
    );


    setOnlineUsers(
      []
    );


    setTypingUsers(
      []
    );


    recentChatEventRef.current = {
      key:
        '',

      receivedAt:
        0,
    };


    const loadRoom =
      async () => {

        try {

          // ------------------------------------------------------
          // LOAD ROOM FROM DATABASE
          // ------------------------------------------------------

          const {
            data,
          } =
            await roomService.get(
              roomCode
            );


          if (
            cancelled
          ) {

            return;
          }


          setRoom(
            data
          );


          const initialCode =
            data.currentCode ||
            '';


          setCode(
            initialCode
          );


          codeRef.current =
            initialCode;


          lastSentCode.current =
            initialCode;


          setLanguage(
            data.currentLanguage ||
            'python'
          );


          // Remove duplicate chat records just in case.
          setChatMessages(
            getUniqueChatMessages(
              data.chat ||
              []
            )
          );


          setVersions(
            data.versions ||
            []
          );


          // ------------------------------------------------------
          // HELP REQUEST INFORMATION
          // ------------------------------------------------------

          try {

            const helpResponse =
              await helpRequestService
                .getByRoom(
                  roomCode
                );


            if (
              cancelled
            ) {

              return;
            }


            const helpData =
              helpResponse.data;


            setHelpRequest(
              helpData.helpRequest ||
              null
            );


            setCanFinishHelp(
              Boolean(
                helpData.canFinish
              )
            );


          } catch (helpErr) {

            if (
              cancelled
            ) {

              return;
            }


            // Normal Invite Collaborator rooms
            // do not have a HelpRequest.
            console.log(
              'No active help request for this room.'
            );


            setHelpRequest(
              null
            );


            setCanFinishHelp(
              false
            );
          }


          if (
            cancelled
          ) {

            return;
          }


          // ======================================================
          // CONNECT COLLABORATION SOCKET
          // ======================================================

          const token =
            localStorage.getItem(
              'collabcode_token'
            );


          const socket =
            connectSocket(
              token
            );


          if (
            cancelled ||
            !socket
          ) {

            return;
          }


          socketRef.current =
            socket;


          // ------------------------------------------------------
          // REMOVE OLD EVENT LISTENERS FIRST
          // ------------------------------------------------------

          removeRoomSocketListeners(
            socket
          );


          // ======================================================
          // INITIAL CODE SYNC
          // ======================================================

          socket.on(
            'code:sync',

            ({
              code:
                syncedCode,

              language:
                syncedLanguage,
            }) => {

              if (
                syncedCode !==
                  undefined &&
                syncedCode !==
                  null
              ) {

                setCode(
                  syncedCode
                );


                codeRef.current =
                  syncedCode;


                lastSentCode.current =
                  syncedCode;
              }


              if (
                syncedLanguage
              ) {

                setLanguage(
                  syncedLanguage
                );
              }
            }
          );


          // ======================================================
          // LIVE CODE UPDATE
          // ======================================================

          socket.on(
            'code:update',

            ({
              code:
                newCode,

              language:
                newLanguage,
            }) => {

              if (
                newCode !==
                  undefined &&
                newCode !==
                  null
              ) {

                setCode(
                  newCode
                );


                codeRef.current =
                  newCode;


                lastSentCode.current =
                  newCode;
              }


              if (
                newLanguage
              ) {

                setLanguage(
                  newLanguage
                );
              }
            }
          );


          // ======================================================
          // LANGUAGE UPDATE
          // ======================================================

          socket.on(
            'code:language',

            ({
              language:
                newLanguage,
            }) => {

              if (
                newLanguage
              ) {

                setLanguage(
                  newLanguage
                );
              }
            }
          );


          // ======================================================
          // USER JOINED
          // ======================================================

          socket.on(
            'user:joined',

            ({
              name,
            }) => {

              if (
                name
              ) {

                toast.info(
                  `${name} joined the room`
                );
              }
            }
          );


          // ======================================================
          // USER LEFT
          // ======================================================

          socket.on(
            'user:left',

            ({
              name,
            }) => {

              if (
                name
              ) {

                toast.info(
                  `${name} left the room`
                );
              }
            }
          );


          // ======================================================
          // ONLINE USERS
          // ======================================================

          socket.on(
            'room:users',

            (
              users
            ) => {

              setOnlineUsers(
                getUniqueOnlineUsers(
                  users
                )
              );
            }
          );


          // ======================================================
          // CHAT MESSAGE
          // ======================================================

          socket.on(
            'chat:message',

            (
              message
            ) => {

              if (
                !message
              ) {

                return;
              }


              // --------------------------------------------------
              // First try MongoDB id / createdAt deduplication
              // --------------------------------------------------

              const stableKey =
                getStableChatMessageKey(
                  message
                );


              // --------------------------------------------------
              // Fallback when socket payload has no id/timestamp
              // --------------------------------------------------

              if (
                !stableKey
              ) {

                const temporaryKey =
                  getTemporaryChatMessageKey(
                    message
                  );


                const now =
                  Date.now();


                const recent =
                  recentChatEventRef
                    .current;


                if (
                  recent.key ===
                    temporaryKey &&
                  now -
                    recent.receivedAt <
                    1200
                ) {

                  // Same socket event received twice.
                  return;
                }


                recentChatEventRef.current = {
                  key:
                    temporaryKey,

                  receivedAt:
                    now,
                };
              }


              setChatMessages(
                (
                  previous
                ) => {

                  if (
                    stableKey
                  ) {

                    const alreadyExists =
                      previous.some(
                        (
                          previousMessage
                        ) =>

                          getStableChatMessageKey(
                            previousMessage
                          ) ===
                          stableKey
                      );


                    if (
                      alreadyExists
                    ) {

                      return previous;
                    }
                  }


                  return [
                    ...previous,
                    message,
                  ];
                }
              );
            }
          );


          // ======================================================
          // TYPING START
          // ======================================================

          socket.on(
            'typing:start',

            ({
              name,
            }) => {

              if (
                !name
              ) {

                return;
              }


              setTypingUsers(
                (
                  previous
                ) =>

                  previous.includes(
                    name
                  )

                    ? previous

                    : [
                        ...previous,
                        name,
                      ]
              );
            }
          );


          // ======================================================
          // TYPING STOP
          // ======================================================

          socket.on(
            'typing:stop',

            ({
              name,
            }) => {

              if (
                !name
              ) {

                return;
              }


              setTypingUsers(
                (
                  previous
                ) =>

                  previous.filter(
                    (
                      userName
                    ) =>

                      userName !==
                      name
                  )
              );
            }
          );


          // ======================================================
          // VERSION SAVED
          // ======================================================

          socket.on(
            'version:saved',

            (
              version
            ) => {

              if (
                !version
              ) {

                return;
              }


              setVersions(
                (
                  previous
                ) => {

                  if (
                    version._id
                  ) {

                    const alreadyExists =
                      previous.some(
                        (
                          existingVersion
                        ) =>

                          existingVersion
                            ?._id
                            ?.toString() ===

                          version
                            ._id
                            .toString()
                      );


                    if (
                      alreadyExists
                    ) {

                      return previous;
                    }
                  }


                  return [
                    version,
                    ...previous,
                  ];
                }
              );


              toast.success(
                `Version saved by ${
                  version.savedByName ||
                  'Unknown'
                }`
              );
            }
          );


          // ------------------------------------------------------
          // IMPORTANT:
          // JOIN ONLY AFTER ALL LISTENERS ARE REGISTERED.
          // ------------------------------------------------------

          socket.emit(
            'room:join',

            {
              roomCode,
            }
          );


        } catch (err) {

          if (
            cancelled
          ) {

            return;
          }


          console.error(
            'Failed to load room:',
            err
          );


          toast.error(
            err.response?.data
              ?.message ||
            'Failed to load room'
          );


          navigate(
            '/dashboard'
          );


        } finally {

          if (
            !cancelled
          ) {

            setLoading(
              false
            );
          }
        }
      };


    loadRoom();


    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {

      cancelled =
        true;


      if (
        typingTimeout.current
      ) {

        clearTimeout(
          typingTimeout.current
        );


        typingTimeout.current =
          null;
      }


      const socket =
        socketRef.current;


      if (
        socket
      ) {

        removeRoomSocketListeners(
          socket
        );


        socketRef.current =
          null;
      }


      setTypingUsers(
        []
      );


      setOnlineUsers(
        []
      );


      disconnectSocket();
    };


  }, [
    roomCode,
    navigate,
  ]);


  // ============================================================
  // CODE CHANGE
  // ============================================================

  const handleCodeChange =
    useCallback(

      (
        value
      ) => {

        const newCode =
          value ||
          '';


        const oldCode =
          codeRef.current;


        const added =
          Math.max(
            0,

            newCode.length -
              oldCode.length
          );


        const deleted =
          Math.max(
            0,

            oldCode.length -
              newCode.length
          );


        contributionBuffer
          .current
          .added +=
            added;


        contributionBuffer
          .current
          .deleted +=
            deleted;


        setCode(
          newCode
        );


        codeRef.current =
          newCode;


        const socket =
          socketRef.current;


        if (
          socket
        ) {

          socket.emit(
            'code:edit',

            {
              roomCode,

              code:
                newCode,

              language,
            }
          );


          lastSentCode.current =
            newCode;


          socket.emit(
            'typing:start',

            {
              roomCode,
            }
          );


          if (
            typingTimeout.current
          ) {

            clearTimeout(
              typingTimeout.current
            );
          }


          typingTimeout.current =
            setTimeout(
              () => {

                socket.emit(
                  'typing:stop',

                  {
                    roomCode,
                  }
                );

              },

              1500
            );
        }
      },

      [
        roomCode,
        language,
      ]
    );


  // ============================================================
  // CONTRIBUTION UPDATE
  // ============================================================

  useEffect(() => {

    const interval =
      setInterval(
        () => {

          const buffer =
            contributionBuffer
              .current;


          if (
            buffer.added >
              0 ||
            buffer.deleted >
              0
          ) {

            const socket =
              socketRef.current;


            if (
              socket
            ) {

              socket.emit(
                'contribution:update',

                {
                  roomCode,

                  added:
                    buffer.added,

                  deleted:
                    buffer.deleted,

                  linesEdited:
                    0,
                }
              );
            }


            contributionBuffer.current = {
              added:
                0,

              deleted:
                0,
            };
          }
        },

        5000
      );


    return () => {

      clearInterval(
        interval
      );
    };


  }, [
    roomCode,
  ]);


  // ============================================================
  // LANGUAGE CHANGE
  // ============================================================

  const handleLanguageChange =
    (
      newLanguage
    ) => {

      setLanguage(
        newLanguage
      );


      const socket =
        socketRef.current;


      if (
        socket
      ) {

        socket.emit(
          'code:language',

          {
            roomCode,

            language:
              newLanguage,
          }
        );
      }
    };


  // ============================================================
  // RUN CODE
  // ============================================================

  const handleRun =
    async () => {

      try {

        setRunning(
          true
        );


        setOutput(
          null
        );


        const {
          data,
        } =
          await submissionService
            .run({
              code,
              language,
              stdin,
            });


        setOutput(
          data
        );


      } catch (err) {

        toast.error(
          err.response?.data
            ?.message ||
          'Failed to run code'
        );


      } finally {

        setRunning(
          false
        );
      }
    };


  // ============================================================
  // TEST CODE
  // ============================================================

  const handleTest =
    async () => {

      try {

        setRunning(
          true
        );


        const {
          data,
        } =
          await submissionService
            .test({
              code,

              language,

              problemId:
                room.problem?._id ||
                room.problem,
            });


        setOutput({
          testResults:
            data,
        });


        toast.info(
          `${data.passed}/${data.total} test cases passed`
        );


      } catch (err) {

        toast.error(
          err.response?.data
            ?.message ||
          'Failed to test code'
        );


      } finally {

        setRunning(
          false
        );
      }
    };


  // ============================================================
  // SUBMIT CODE
  // ============================================================

  const handleSubmit =
    async () => {

      try {

        setRunning(
          true
        );


        const {
          data,
        } =
          await submissionService
            .submit({
              code,

              language,

              problemId:
                room.problem?._id ||
                room.problem,

              roomCode,
            });


        setOutput({
          submitResult:
            data,
        });


        if (
          data.allPassed
        ) {

          toast.success(
            `🎉 Accepted! ${data.testCasesPassed}/${data.totalTestCases} passed`
          );


        } else {

          toast.error(
            `${data.status}: ${data.testCasesPassed}/${data.totalTestCases} passed`
          );
        }


      } catch (err) {

        toast.error(
          err.response?.data
            ?.message ||
          'Failed to submit'
        );


      } finally {

        setRunning(
          false
        );
      }
    };


  // ============================================================
  // SAVE VERSION
  // ============================================================

  const handleSaveVersion =
    () => {

      const label =
        window.prompt(
          'Label for this version (optional):',
          ''
        );


      if (
        label ===
        null
      ) {

        return;
      }


      const socket =
        socketRef.current;


      if (
        socket
      ) {

        socket.emit(
          'code:saveVersion',

          {
            roomCode,
            code,
            language,
            label,
          }
        );
      }
    };


  // ============================================================
  // SEND CHAT
  // ============================================================

  const handleSendMessage =
    (
      text
    ) => {

      const socket =
        socketRef.current;


      const cleanText =
        text?.trim();


      if (
        socket &&
        cleanText
      ) {

        // IMPORTANT:
        // Do NOT add the message to local state here.
        // Wait for chat:message from the server.
        socket.emit(
          'chat:message',

          {
            roomCode,

            text:
              cleanText,
          }
        );
      }
    };


  // ============================================================
  // COPY ROOM CODE
  // ============================================================

  const handleCopyCode =
    async () => {

      try {

        await navigator.clipboard
          .writeText(
            roomCode
          );


        toast.success(
          'Room code copied!'
        );


      } catch (err) {

        toast.error(
          'Unable to copy room code'
        );
      }
    };


  // ============================================================
  // FINISH HELP
  // ============================================================

  const handleFinishHelp =
    async () => {

      if (
        !helpRequest?._id
      ) {

        toast.error(
          'Help request information is missing'
        );


        return;
      }


      if (
        !output?.testResults
      ) {

        toast.error(
          'Please run Test before finishing help'
        );


        return;
      }


      if (
        !finishForm
          .problemFound
          .trim()
      ) {

        toast.error(
          'Please explain what problem you found'
        );


        return;
      }


      if (
        !finishForm
          .whyWrong
          .trim()
      ) {

        toast.error(
          'Please explain why the code was wrong'
        );


        return;
      }


      if (
        !finishForm
          .changesMade
          .trim()
      ) {

        toast.error(
          'Please explain what changes you made'
        );


        return;
      }


      if (
        !finishForm
          .solutionExplanation
          .trim()
      ) {

        toast.error(
          'Please explain how the corrected solution works'
        );


        return;
      }


      try {

        setFinishingHelp(
          true
        );


        const testResults =
          output.testResults;


        const {
          data,
        } =
          await helpRequestService
            .finish(
              helpRequest._id,

              {
                issueType:
                  finishForm
                    .issueType,

                problemFound:
                  finishForm
                    .problemFound
                    .trim(),

                incorrectLocation:
                  finishForm
                    .incorrectLocation
                    .trim(),

                whyWrong:
                  finishForm
                    .whyWrong
                    .trim(),

                changesMade:
                  finishForm
                    .changesMade
                    .trim(),

                solutionExplanation:
                  finishForm
                    .solutionExplanation
                    .trim(),

                testResult: {
                  passed:
                    testResults.passed ||
                    0,

                  total:
                    testResults.total ||
                    0,

                  allPassed:
                    testResults.total >
                      0 &&
                    testResults.passed ===
                      testResults.total,
                },
              }
            );


        toast.success(
          '✅ Solution sent to the requester!'
        );


        setCanFinishHelp(
          false
        );


        setShowFinishHelpModal(
          false
        );


        setHelpRequest(
          (
            previous
          ) => {

            if (
              !previous
            ) {

              return previous;
            }


            return {
              ...previous,

              status:
                data.status ||
                'solution_sent',
            };
          }
        );


        setFinishForm({
          issueType:
            'Logic Error',

          problemFound:
            '',

          incorrectLocation:
            '',

          whyWrong:
            '',

          changesMade:
            '',

          solutionExplanation:
            '',
        });


      } catch (err) {

        console.error(
          'Finish help error:',
          err
        );


        toast.error(
          err.response?.data
            ?.message ||
          'Failed to send solution'
        );


      } finally {

        setFinishingHelp(
          false
        );
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (
    loading
  ) {

    return (
      <div className="loading">

        <div className="spinner" />

      </div>
    );
  }


  if (
    !room
  ) {

    return (
      <div className="empty-state">

        <p>
          Room not found.
        </p>

      </div>
    );
  }


  const problem =
    room.problem ||
    {};


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="room-layout">

      {/* ROOM HEADER */}

      <div className="room-header">

        <div className="flex items-center gap-3">

          <button
            className="btn btn-ghost btn-sm"

            onClick={() =>
              navigate(
                '/dashboard'
              )
            }
          >
            ← Exit
          </button>


          <div className="flex items-center gap-2">

            <strong>
              {
                problem.title ||
                'Problem'
              }
            </strong>


            {problem.difficulty && (

              <span
                className={`badge ${
                  DIFFICULTY_COLORS[
                    problem.difficulty
                  ] || ''
                }`}
              >
                {
                  problem.difficulty
                }
              </span>

            )}

          </div>

        </div>


        {/* ROOM CODE */}

        <div className="room-code-display">

          <span className="text-secondary text-sm">
            Room Code:
          </span>


          <span className="code">
            {
              roomCode
            }
          </span>


          <button
            className="btn btn-ghost btn-sm"

            onClick={
              handleCopyCode
            }
          >
            📋 Copy
          </button>

        </div>


        {/* ONLINE USERS */}

        <div className="online-users">

          {onlineUsers.map(
            (
              user
            ) => (

              <div
                key={
                  getOnlineUserKey(
                    user
                  )
                }

                className="online-user"

                title={
                  user.name
                }
              >

                <div
                  className="avatar"

                  style={{
                    background:
                      user.color ||
                      user.avatarColor,

                    width:
                      28,

                    height:
                      28,

                    fontSize:
                      11,
                  }}
                >

                  {
                    getInitials(
                      user.name
                    )
                  }

                </div>

              </div>

            )
          )}


          <span className="text-muted text-sm">

            {
              onlineUsers.length
            }{' '}

            online

          </span>

        </div>

      </div>


      {/* ===================================================== */}
      {/* MAIN EDITOR */}
      {/* ===================================================== */}

      <div className="room-main">

        {/* TOOLBAR */}

        <div className="editor-toolbar">

          <div className="editor-toolbar-left">

            <select
              value={
                language
              }

              onChange={(e) =>
                handleLanguageChange(
                  e.target.value
                )
              }

              style={{
                width:
                  'auto',

                minWidth:
                  '120px',
              }}
            >

              {LANGUAGES.map(
                (
                  lang
                ) => (

                  <option
                    key={
                      lang.key
                    }

                    value={
                      lang.key
                    }
                  >
                    {
                      lang.label
                    }
                  </option>

                )
              )}

            </select>


            <button
              className="btn btn-ghost btn-sm"

              onClick={
                handleSaveVersion
              }
            >
              💾 Save Version
            </button>

          </div>


          <div className="editor-toolbar-right">

            <button
              className="btn btn-secondary btn-sm"

              onClick={
                handleRun
              }

              disabled={
                running
              }
            >
              ▶ Run
            </button>


            <button
              className="btn btn-secondary btn-sm"

              onClick={
                handleTest
              }

              disabled={
                running
              }
            >
              🧪 Test
            </button>


            <button
              className="btn btn-success btn-sm"

              onClick={
                handleSubmit
              }

              disabled={
                running
              }
            >
              ✓ Submit
            </button>


            {canFinishHelp && (

              <button
                className="btn btn-warning btn-sm"

                onClick={() =>
                  setShowFinishHelpModal(
                    true
                  )
                }

                disabled={
                  running ||
                  finishingHelp
                }
              >
                ✅ Finish Help
              </button>

            )}

          </div>

        </div>


        {/* MONACO EDITOR */}

        <div className="editor-container">

          <Editor
            height="100%"

            language={
              LANGUAGES.find(
                (
                  lang
                ) =>
                  lang.key ===
                  language
              )?.monaco ||
              'python'
            }

            theme="vs-dark"

            value={
              code
            }

            onChange={
              handleCodeChange
            }

            options={{
              fontSize:
                14,

              minimap: {
                enabled:
                  false,
              },

              scrollBeyondLastLine:
                false,

              automaticLayout:
                true,

              tabSize:
                4,

              wordWrap:
                'on',
            }}
          />

        </div>


        {/* OUTPUT */}

        <div className="output-panel">

          <div className="output-header">

            <span>
              Custom Input
            </span>

          </div>


          <textarea
            value={
              stdin
            }

            onChange={(e) =>
              setStdin(
                e.target.value
              )
            }

            placeholder="Enter stdin..."

            style={{
              width:
                '100%',

              minHeight:
                '40px',

              marginBottom:
                '8px',
            }}
          />


          {running && (

            <div className="flex items-center gap-2 text-secondary">

              <div className="spinner" />

              Running...

            </div>

          )}


          {/* RUN OUTPUT */}

          {output?.stdout !==
            undefined && (

            <div className="mt-2">

              <div className="output-header">

                <span>
                  Output
                </span>


                {output.status && (

                  <span
                    className={`badge ${
                      output.status.id ===
                        3

                        ? 'badge-easy'

                        : output.status.id ===
                          6

                        ? 'badge-hard'

                        : 'badge-medium'
                    }`}
                  >
                    {
                      output.status
                        .description
                    }
                  </span>

                )}

              </div>


              {output.stdout && (

                <pre>
                  {
                    output.stdout
                  }
                </pre>

              )}


              {output.stderr && (

                <pre className="text-danger">
                  {
                    output.stderr
                  }
                </pre>

              )}


              {output.compileOutput && (

                <pre className="text-warning">
                  {
                    output.compileOutput
                  }
                </pre>

              )}

            </div>

          )}


          {/* TEST RESULT */}

          {output?.testResults && (

            <div className="mt-2">

              <div className="output-header">

                <span>

                  Test Results (

                  {
                    output
                      .testResults
                      .passed
                  }

                  /

                  {
                    output
                      .testResults
                      .total
                  }

                  )

                </span>

              </div>


              {output.testResults
                .results
                ?.map(
                  (
                    result,
                    index
                  ) => (

                    <div
                      key={
                        index
                      }

                      className={`test-result ${
                        result.passed
                          ? 'pass'
                          : 'fail'
                      }`}
                    >

                      {
                        result.passed
                          ? '✓'
                          : '✗'
                      }{' '}

                      Test Case{' '}

                      {
                        index + 1
                      }


                      {!result.passed && (

                        <div
                          className="text-sm mt-1"

                          style={{
                            marginLeft:
                              16,
                          }}
                        >

                          <div>

                            Expected:{' '}

                            {
                              result
                                .expectedOutput
                            }

                          </div>


                          <div>

                            Got:{' '}

                            {
                              result
                                .actualOutput
                            }

                          </div>

                        </div>

                      )}

                    </div>

                  )
                )}

            </div>

          )}


          {/* SUBMISSION RESULT */}

          {output?.submitResult && (

            <div className="mt-2">

              <div
                className={`test-result ${
                  output
                    .submitResult
                    .allPassed

                    ? 'pass'

                    : 'fail'
                }`}
              >

                {
                  output
                    .submitResult
                    .allPassed

                    ? '🎉'

                    : '❌'
                }{' '}


                {
                  output
                    .submitResult
                    .status
                }


                <div
                  className="text-sm"

                  style={{
                    marginLeft:
                      16,
                  }}
                >

                  {
                    output
                      .submitResult
                      .testCasesPassed
                  }{' '}

                  /{' '}

                  {
                    output
                      .submitResult
                      .totalTestCases
                  }{' '}

                  passed

                </div>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <div className="room-sidebar">

        <div className="sidebar-tabs">

          <button
            className={`sidebar-tab ${
              activeTab ===
                'problem'
                ? 'active'
                : ''
            }`}

            onClick={() =>
              setActiveTab(
                'problem'
              )
            }
          >
            Problem
          </button>


          <button
            className={`sidebar-tab ${
              activeTab ===
                'chat'
                ? 'active'
                : ''
            }`}

            onClick={() =>
              setActiveTab(
                'chat'
              )
            }
          >
            Chat
          </button>


          <button
            className={`sidebar-tab ${
              activeTab ===
                'versions'
                ? 'active'
                : ''
            }`}

            onClick={() =>
              setActiveTab(
                'versions'
              )
            }
          >
            History
          </button>


          <button
            className={`sidebar-tab ${
              activeTab ===
                'review'
                ? 'active'
                : ''
            }`}

            onClick={() =>
              setActiveTab(
                'review'
              )
            }
          >
            Review
          </button>


          <button
            className={`sidebar-tab ${
              activeTab ===
                'contributions'
                ? 'active'
                : ''
            }`}

            onClick={() =>
              setActiveTab(
                'contributions'
              )
            }
          >
            Stats
          </button>

        </div>


        <div className="sidebar-content">

          {/* ================================================= */}
          {/* PROBLEM TAB */}
          {/* ================================================= */}

          {activeTab ===
            'problem' && (

            <div
              style={{
                padding:
                  '18px',

                overflowY:
                  'auto',

                height:
                  '100%',
              }}
            >

              {/* HELP REQUEST QUESTION */}

              {helpRequest?.message && (

                <div
                  className="example"

                  style={{
                    marginBottom:
                      '16px',

                    borderLeft:
                      '4px solid #f59e0b',
                  }}
                >

                  <strong>
                    🆘 Help Requested
                  </strong>

                  <br />


                  {helpRequest
                    .requester
                    ?.name && (

                    <>
                      <span className="text-muted text-sm">

                        {
                          helpRequest
                            .requester
                            .name
                        }{' '}

                        asked:

                      </span>

                      <br />

                    </>

                  )}


                  {
                    helpRequest.message
                  }

                </div>

              )}


              {!problem?._id &&
              !problem?.title ? (

                <div className="empty-state">

                  <p>
                    Problem information not available.
                  </p>

                </div>

              ) : (

                <>

                  {/* TITLE */}

                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'space-between',

                      alignItems:
                        'flex-start',

                      gap:
                        '10px',

                      marginBottom:
                        '14px',
                    }}
                  >

                    <h3
                      style={{
                        margin:
                          0,
                      }}
                    >
                      {
                        problem.title
                      }
                    </h3>


                    {problem.difficulty && (

                      <span
                        className={`badge ${
                          DIFFICULTY_COLORS[
                            problem
                              .difficulty
                          ] || ''
                        }`}
                      >
                        {
                          problem
                            .difficulty
                        }
                      </span>

                    )}

                  </div>


                  {/* TAGS */}

                  {problem.tags?.length >
                    0 && (

                    <div
                      className="flex gap-2"

                      style={{
                        flexWrap:
                          'wrap',

                        marginBottom:
                          '16px',
                      }}
                    >

                      {problem.tags.map(
                        (
                          tag
                        ) => (

                          <span
                            key={
                              tag
                            }

                            className="badge badge-info"
                          >
                            {
                              tag
                            }
                          </span>

                        )
                      )}

                    </div>

                  )}


                  {/* DESCRIPTION */}

                  {problem.description ? (

                    <div
                      className="description"

                      style={{
                        whiteSpace:
                          'pre-wrap',

                        lineHeight:
                          1.6,

                        marginBottom:
                          '18px',
                      }}
                    >
                      {
                        problem.description
                      }
                    </div>

                  ) : (

                    <p className="text-muted text-sm">

                      Problem description is not available.

                    </p>

                  )}


                  {/* EXAMPLES */}

                  {problem.examples?.length >
                    0 && (

                    <>

                      <h4
                        style={{
                          marginBottom:
                            '10px',
                        }}
                      >
                        Examples
                      </h4>


                      {problem.examples.map(
                        (
                          example,
                          index
                        ) => (

                          <div
                            key={
                              index
                            }

                            className="example"

                            style={{
                              marginBottom:
                                '12px',
                            }}
                          >

                            <strong>

                              Example{' '}

                              {
                                index + 1
                              }

                            </strong>


                            <br />


                            <strong>
                              Input:
                            </strong>{' '}


                            <span
                              style={{
                                whiteSpace:
                                  'pre-wrap',
                              }}
                            >
                              {
                                example.input
                              }
                            </span>


                            <br />


                            <strong>
                              Output:
                            </strong>{' '}


                            <span
                              style={{
                                whiteSpace:
                                  'pre-wrap',
                              }}
                            >
                              {
                                example.output
                              }
                            </span>


                            {example.explanation && (

                              <>

                                <br />


                                <strong>
                                  Explanation:
                                </strong>{' '}


                                {
                                  example.explanation
                                }

                              </>

                            )}

                          </div>

                        )
                      )}

                    </>

                  )}


                  {/* CONSTRAINTS */}

                  {problem.constraints && (

                    <div
                      className="example"

                      style={{
                        marginTop:
                          '16px',
                      }}
                    >

                      <strong>
                        Constraints
                      </strong>


                      <pre
                        style={{
                          whiteSpace:
                            'pre-wrap',

                          wordBreak:
                            'break-word',

                          fontFamily:
                            'inherit',

                          marginTop:
                            '8px',

                          marginBottom:
                            0,
                        }}
                      >
                        {
                          problem.constraints
                        }
                      </pre>

                    </div>

                  )}

                </>

              )}

            </div>

          )}


          {/* CHAT */}

          {activeTab ===
            'chat' && (

            <ChatPanel
              messages={
                chatMessages
              }

              onSend={
                handleSendMessage
              }

              typingUsers={
                typingUsers
              }
            />

          )}


          {/* HISTORY */}

          {activeTab ===
            'versions' && (

            <VersionHistory
              versions={
                versions
              }

              roomCode={
                roomCode
              }

              onRestore={(
                version
              ) => {

                setCode(
                  version.code
                );


                setLanguage(
                  version.language
                );


                codeRef.current =
                  version.code;


                lastSentCode.current =
                  version.code;


                toast.success(
                  'Version restored'
                );
              }}
            />

          )}


          {/* REVIEW */}

          {activeTab ===
            'review' && (

            <ReviewPanel
              roomCode={
                roomCode
              }

              code={
                code
              }

              language={
                language
              }
            />

          )}


          {/* STATS */}

          {activeTab ===
            'contributions' && (

            <ContributionPanel
              roomCode={
                roomCode
              }
            />

          )}

        </div>

      </div>


      {/* ===================================================== */}
      {/* FINISH HELP MODAL */}
      {/* ===================================================== */}

      {showFinishHelpModal && (

        <div
          className="modal-overlay"

          onClick={() => {

            if (
              !finishingHelp
            ) {

              setShowFinishHelpModal(
                false
              );
            }
          }}
        >

          <div
            className="modal"

            onClick={(e) =>
              e.stopPropagation()
            }

            style={{
              maxWidth:
                '650px',

              width:
                '90%',

              maxHeight:
                '90vh',

              overflowY:
                'auto',
            }}
          >

            <h3>
              ✅ Finish Help
            </h3>


            <p className="text-secondary text-sm mb-3">

              Explain what was wrong and how you
              corrected it so the requester can
              understand the solution.

            </p>


            {/* REQUESTER QUESTION */}

            {helpRequest?.message && (

              <div
                className="example"

                style={{
                  marginBottom:
                    '16px',
                }}
              >

                <strong>
                  🆘 Requester Asked
                </strong>


                <br />


                {
                  helpRequest.message
                }

              </div>

            )}


            {/* TEST RESULT */}

            <div
              className="example"

              style={{
                marginBottom:
                  '16px',
              }}
            >

              <strong>
                🧪 Current Test Result
              </strong>


              <br />


              {output?.testResults ? (

                <>

                  {
                    output
                      .testResults
                      .passed ===

                    output
                      .testResults
                      .total

                      ? '✅'

                      : '⚠️'
                  }{' '}


                  {
                    output
                      .testResults
                      .passed
                  }

                  /

                  {
                    output
                      .testResults
                      .total
                  }{' '}

                  test cases passed

                </>

              ) : (

                <span className="text-warning">

                  ⚠️ Run Test before finishing help.

                </span>

              )}

            </div>


            {/* ISSUE TYPE */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  Issue Type
                </strong>

              </label>


              <select
                value={
                  finishForm
                    .issueType
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      issueType:
                        e.target.value,
                    })
                  )
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  marginTop:
                    '6px',
                }}
              >

                <option value="Logic Error">
                  Logic Error
                </option>

                <option value="Wrong Answer">
                  Wrong Answer
                </option>

                <option value="Runtime Error">
                  Runtime Error
                </option>

                <option value="Compilation Error">
                  Compilation Error
                </option>

                <option value="Time Complexity">
                  Time Complexity
                </option>

                <option value="Space Complexity">
                  Space Complexity
                </option>

                <option value="Algorithm Understanding">
                  Algorithm Understanding
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            {/* PROBLEM FOUND */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  What problem did you find? *
                </strong>

              </label>


              <textarea
                value={
                  finishForm
                    .problemFound
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      problemFound:
                        e.target.value,
                    })
                  )
                }

                placeholder="Example: The complement lookup was done after inserting the current value."

                maxLength={
                  500
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  minHeight:
                    '80px',

                  marginTop:
                    '6px',

                  resize:
                    'vertical',
                }}
              />

            </div>


            {/* INCORRECT LOCATION */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  Incorrect Location
                </strong>

              </label>


              <input
                type="text"

                value={
                  finishForm
                    .incorrectLocation
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      incorrectLocation:
                        e.target.value,
                    })
                  )
                }

                placeholder="Example: Line 28"

                maxLength={
                  200
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  marginTop:
                    '6px',
                }}
              />

            </div>


            {/* WHY WRONG */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  Why was it wrong? *
                </strong>

              </label>


              <textarea
                value={
                  finishForm
                    .whyWrong
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      whyWrong:
                        e.target.value,
                    })
                  )
                }

                placeholder="Explain why the original code or logic produced the wrong result."

                maxLength={
                  1000
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  minHeight:
                    '90px',

                  marginTop:
                    '6px',

                  resize:
                    'vertical',
                }}
              />

            </div>


            {/* CHANGES MADE */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  What changes did you make? *
                </strong>

              </label>


              <textarea
                value={
                  finishForm
                    .changesMade
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      changesMade:
                        e.target.value,
                    })
                  )
                }

                placeholder="Explain which code or logic you changed."

                maxLength={
                  1000
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  minHeight:
                    '90px',

                  marginTop:
                    '6px',

                  resize:
                    'vertical',
                }}
              />

            </div>


            {/* SOLUTION EXPLANATION */}

            <div
              style={{
                marginBottom:
                  '14px',
              }}
            >

              <label>

                <strong>
                  How does the corrected solution work? *
                </strong>

              </label>


              <textarea
                value={
                  finishForm
                    .solutionExplanation
                }

                onChange={(e) =>
                  setFinishForm(
                    (
                      previous
                    ) => ({
                      ...previous,

                      solutionExplanation:
                        e.target.value,
                    })
                  )
                }

                placeholder="Explain the corrected logic step by step so the requester can understand it."

                maxLength={
                  1500
                }

                disabled={
                  finishingHelp
                }

                style={{
                  width:
                    '100%',

                  minHeight:
                    '120px',

                  marginTop:
                    '6px',

                  resize:
                    'vertical',
                }}
              />

            </div>


            {/* ACTIONS */}

            <div className="modal-actions">

              <button
                className="btn btn-ghost"

                onClick={() =>
                  setShowFinishHelpModal(
                    false
                  )
                }

                disabled={
                  finishingHelp
                }
              >
                Cancel
              </button>


              <button
                className="btn btn-success"

                onClick={
                  handleFinishHelp
                }

                disabled={
                  finishingHelp ||
                  !output?.testResults
                }
              >

                {
                  finishingHelp

                    ? 'Sending Solution...'

                    : '✅ Send Solution to Requester'
                }

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}