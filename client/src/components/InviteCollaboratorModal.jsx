import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  roomService,
  roomInvitationService,
} from '../services';

import {
  getInitials,
} from '../utils/constants';

import {
  toast,
} from './ToastContainer';


export default function InviteCollaboratorModal({
  open,
  onClose,
  problem,
  problemId,
  language,
  code,
}) {
  const navigate =
    useNavigate();


  const [
    searchText,
    setSearchText,
  ] =
    useState('');


  const [
    users,
    setUsers,
  ] =
    useState([]);


  const [
    selectedUser,
    setSelectedUser,
  ] =
    useState(null);


  const [
    searching,
    setSearching,
  ] =
    useState(false);


  const [
    processing,
    setProcessing,
  ] =
    useState(false);


  const [
    roomCode,
    setRoomCode,
  ] =
    useState('');


  const [
    invitationSent,
    setInvitationSent,
  ] =
    useState(false);


  // ============================================================
  // RESET
  // ============================================================

  useEffect(() => {
    if (!open) {
      setSearchText(
        ''
      );

      setUsers(
        []
      );

      setSelectedUser(
        null
      );

      setRoomCode(
        ''
      );

      setInvitationSent(
        false
      );

      setProcessing(
        false
      );
    }
  }, [open]);


  // ============================================================
  // SEARCH USERS
  // ============================================================

  useEffect(() => {
    if (
      !open ||
      searchText.trim().length <
        2
    ) {
      setUsers(
        []
      );

      return;
    }


    const timer =
      setTimeout(
        async () => {
          try {
            setSearching(
              true
            );


            const {
              data,
            } =
              await roomInvitationService
                .searchUsers(
                  searchText.trim()
                );


            setUsers(
              Array.isArray(data)
                ? data
                : []
            );


          } catch (err) {
            console.error(
              'Search collaborators error:',
              err
            );


          } finally {
            setSearching(
              false
            );
          }
        },

        400
      );


    return () =>
      clearTimeout(
        timer
      );

  }, [
    searchText,
    open,
  ]);


  // ============================================================
  // CREATE ROOM IF NEEDED
  // ============================================================

  const createRoomIfNeeded =
    async () => {
      if (roomCode) {
        return roomCode;
      }


      const {
        data,
      } =
        await roomService.create({
          problemId,
          language,
          currentCode:
            code,
        });


      if (!data?.roomCode) {
        throw new Error(
          'Room code was not returned by server'
        );
      }


      setRoomCode(
        data.roomCode
      );


      return data.roomCode;
    };


  // ============================================================
  // CREATE ROOM + SEND INVITATION
  // ============================================================

  const handleSendInvitation =
    async () => {
      if (!selectedUser) {
        toast.error(
          'Please select a friend to invite'
        );

        return;
      }


      try {
        setProcessing(
          true
        );


        // First create collaboration room
        const codeToUse =
          await createRoomIfNeeded();


        // Then invite selected friend
        const {
          data,
        } =
          await roomInvitationService
            .invite(
              codeToUse,
              selectedUser._id
            );


        setInvitationSent(
          true
        );


        toast.success(
          data?.message ||
          `Invitation sent to ${selectedUser.name}`
        );


      } catch (err) {
        console.error(
          'Invite collaborator error:',
          err
        );


        toast.error(
          err.response?.data
            ?.message ||
          err.message ||
          'Failed to invite collaborator'
        );


      } finally {
        setProcessing(
          false
        );
      }
    };


  // ============================================================
  // CREATE SHAREABLE ROOM ONLY
  // ============================================================

  const handleCreateShareableRoom =
    async () => {
      try {
        setProcessing(
          true
        );


        const codeToUse =
          await createRoomIfNeeded();


        toast.success(
          `Room ${codeToUse} created`
        );


      } catch (err) {
        console.error(
          'Create room error:',
          err
        );


        toast.error(
          err.response?.data
            ?.message ||
          err.message ||
          'Failed to create room'
        );


      } finally {
        setProcessing(
          false
        );
      }
    };


  // ============================================================
  // COPY ROOM CODE
  // ============================================================

  const copyRoomCode =
    async () => {
      if (!roomCode) {
        return;
      }


      try {
        await navigator.clipboard
          .writeText(
            roomCode
          );


        toast.success(
          'Room code copied'
        );


      } catch {
        toast.error(
          'Unable to copy room code'
        );
      }
    };


  // ============================================================
  // COPY ROOM LINK
  // ============================================================

  const copyRoomLink =
    async () => {
      if (!roomCode) {
        return;
      }


      const link =
        `${window.location.origin}/room/${roomCode}`;


      try {
        await navigator.clipboard
          .writeText(
            link
          );


        toast.success(
          'Room link copied'
        );


      } catch {
        toast.error(
          'Unable to copy room link'
        );
      }
    };


  if (!open) {
    return null;
  }


  return (
    <div
      className="modal-overlay"

      onClick={() => {
        if (!processing) {
          onClose();
        }
      }}
    >

      <div
        className="modal"

        onClick={(e) =>
          e.stopPropagation()
        }

        style={{
          width:
            '95%',

          maxWidth:
            '650px',

          maxHeight:
            '90vh',

          overflowY:
            'auto',
        }}
      >

        <h2>
          👥 Invite a Collaborator
        </h2>


        <p className="text-secondary text-sm">

          Choose a registered CollabCode
          user to solve this problem
          together.

        </p>


        {/* PROBLEM */}

        <div
          className="example"

          style={{
            marginTop:
              '16px',
          }}
        >

          <strong>
            Problem:
          </strong>{' '}

          {
            problem?.title ||
            'Coding Problem'
          }

          <br />

          <strong>
            Language:
          </strong>{' '}

          {
            language
          }

          <br />

          Your current code will be
          carried into the collaborative
          room.

        </div>


        {!invitationSent && (
          <>

            {/* SEARCH */}

            <div
              style={{
                marginTop:
                  '20px',
              }}
            >

              <label
                style={{
                  display:
                    'block',

                  marginBottom:
                    '7px',

                  fontWeight:
                    600,
                }}
              >

                Search Friend

              </label>


              <input
                type="text"

                value={
                  searchText
                }

                onChange={(e) => {
                  setSearchText(
                    e.target.value
                  );

                  setSelectedUser(
                    null
                  );
                }}

                placeholder="Search by name or email..."

                disabled={
                  processing
                }

                style={{
                  width:
                    '100%',
                }}
              />

            </div>


            {/* SEARCHING */}

            {searching && (
              <div
                className="text-secondary text-sm"

                style={{
                  marginTop:
                    '10px',
                }}
              >
                Searching...
              </div>
            )}


            {/* RESULTS */}

            {!searching &&
              searchText.trim()
                .length >= 2 &&
              users.length ===
                0 && (

              <div
                className="text-secondary text-sm"

                style={{
                  marginTop:
                    '12px',
                }}
              >
                No users found.
              </div>

            )}


            {users.length >
              0 && (

              <div
                style={{
                  display:
                    'grid',

                  gap:
                    '8px',

                  marginTop:
                    '12px',
                }}
              >

                {users.map(
                  (user) => {

                    const selected =
                      selectedUser?._id ===
                      user._id;


                    return (
                      <button
                        key={
                          user._id
                        }

                        type="button"

                        onClick={() =>
                          setSelectedUser(
                            user
                          )
                        }

                        disabled={
                          processing
                        }

                        style={{
                          width:
                            '100%',

                          border:
                            selected
                              ? '1px solid #6366f1'
                              : '1px solid #334155',

                          borderRadius:
                            '8px',

                          padding:
                            '10px 12px',

                          background:
                            selected
                              ? 'rgba(99, 102, 241, 0.15)'
                              : '#111827',

                          color:
                            'inherit',

                          cursor:
                            'pointer',

                          display:
                            'flex',

                          alignItems:
                            'center',

                          textAlign:
                            'left',

                          gap:
                            '12px',
                        }}
                      >

                        <div
                          className="avatar"

                          style={{
                            background:
                              user.avatarColor,
                          }}
                        >

                          {
                            getInitials(
                              user.name
                            )
                          }

                        </div>


                        <div
                          style={{
                            flex:
                              1,
                          }}
                        >

                          <div
                            style={{
                              fontWeight:
                                600,
                            }}
                          >
                            {
                              user.name
                            }
                          </div>


                          <div className="text-secondary text-sm">
                            {
                              user.email
                            }
                          </div>

                        </div>


                        {selected && (
                          <span>
                            ✓ Selected
                          </span>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            )}


            {/* SELECTED */}

            {selectedUser && (
              <div
                className="example"

                style={{
                  marginTop:
                    '16px',
                }}
              >

                <strong>
                  Selected:
                </strong>{' '}

                {
                  selectedUser.name
                }

                <br />

                <span className="text-secondary text-sm">
                  {
                    selectedUser.email
                  }
                </span>

              </div>
            )}


            {/* ACTIONS */}

            <div className="modal-actions">

              <button
                type="button"

                className="btn btn-ghost"

                onClick={
                  onClose
                }

                disabled={
                  processing
                }
              >
                Cancel
              </button>


              <button
                type="button"

                className="btn btn-secondary"

                onClick={
                  handleCreateShareableRoom
                }

                disabled={
                  processing
                }
              >
                {processing
                  ? 'Creating...'
                  : '🔗 Create Shareable Room'}
              </button>


              <button
                type="button"

                className="btn btn-primary"

                onClick={
                  handleSendInvitation
                }

                disabled={
                  processing ||
                  !selectedUser
                }
              >

                {processing
                  ? 'Sending...'
                  : '📨 Create & Send Invitation'}

              </button>

            </div>

          </>
        )}


        {/* ROOM CREATED */}

        {roomCode && (
          <div
            className="example"

            style={{
              marginTop:
                '20px',
            }}
          >

            {invitationSent && (
              <div
                style={{
                  marginBottom:
                    '12px',
                }}
              >

                ✅ Invitation sent to{' '}

                <strong>
                  {
                    selectedUser
                      ?.name
                  }
                </strong>

              </div>
            )}


            <strong>
              Room Code
            </strong>


            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  '10px',

                marginTop:
                  '8px',

                flexWrap:
                  'wrap',
              }}
            >

              <code
                style={{
                  fontSize:
                    '18px',

                  fontWeight:
                    700,
                }}
              >
                {
                  roomCode
                }
              </code>


              <button
                type="button"

                className="btn btn-secondary btn-sm"

                onClick={
                  copyRoomCode
                }
              >
                📋 Copy Code
              </button>


              <button
                type="button"

                className="btn btn-secondary btn-sm"

                onClick={
                  copyRoomLink
                }
              >
                🔗 Copy Link
              </button>

            </div>

          </div>
        )}


        {/* OPEN ROOM */}

        {roomCode && (
          <div
            className="modal-actions"

            style={{
              marginTop:
                '18px',
            }}
          >

            <button
              className="btn btn-ghost"

              onClick={
                onClose
              }
            >
              Close
            </button>


            <button
              className="btn btn-primary"

              onClick={() =>
                navigate(
                  `/room/${roomCode}`
                )
              }
            >
              🚀 Open Collaboration Room
            </button>

          </div>
        )}

      </div>

    </div>
  );
}