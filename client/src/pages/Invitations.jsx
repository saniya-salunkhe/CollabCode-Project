import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  roomInvitationService,
} from '../services';

import {
  DIFFICULTY_COLORS,
} from '../utils/constants';

import {
  toast,
} from '../components/ToastContainer';


export default function Invitations() {
  const navigate =
    useNavigate();


  const [
    invitations,
    setInvitations,
  ] =
    useState([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    processingId,
    setProcessingId,
  ] =
    useState(null);


  // ============================================================
  // LOAD
  // ============================================================

  const loadInvitations =
    async () => {
      try {
        setLoading(
          true
        );


        const {
          data,
        } =
          await roomInvitationService
            .getMine();


        setInvitations(
          Array.isArray(data)
            ? data
            : []
        );


      } catch (err) {
        console.error(
          'Load invitations error:',
          err
        );


        toast.error(
          err.response?.data
            ?.message ||
          'Failed to load invitations'
        );


      } finally {
        setLoading(
          false
        );
      }
    };


  useEffect(() => {
    loadInvitations();
  }, []);


  // ============================================================
  // ACCEPT
  // ============================================================

  const handleAccept =
    async (
      invitation
    ) => {
      try {
        setProcessingId(
          invitation._id
        );


        const {
          data,
        } =
          await roomInvitationService
            .accept(
              invitation._id
            );


        toast.success(
          '✅ Invitation accepted'
        );


        navigate(
          `/room/${data.roomCode}`
        );


      } catch (err) {
        toast.error(
          err.response?.data
            ?.message ||
          'Failed to accept invitation'
        );


      } finally {
        setProcessingId(
          null
        );
      }
    };


  // ============================================================
  // DECLINE
  // ============================================================

  const handleDecline =
    async (
      invitation
    ) => {
      try {
        setProcessingId(
          invitation._id
        );


        await roomInvitationService
          .decline(
            invitation._id
          );


        toast.info(
          'Invitation declined'
        );


        await loadInvitations();


      } catch (err) {
        toast.error(
          err.response?.data
            ?.message ||
          'Failed to decline invitation'
        );


      } finally {
        setProcessingId(
          null
        );
      }
    };


  // ============================================================
  // STATUS
  // ============================================================

  const statusText =
    (status) => {
      switch (status) {
        case 'pending':
          return '⏳ Pending';

        case 'accepted':
          return '✅ Accepted';

        case 'declined':
          return '❌ Declined';

        default:
          return status;
      }
    };


  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }


  return (
    <div
      style={{
        maxWidth:
          '1000px',

        margin:
          '0 auto',

        padding:
          '28px',
      }}
    >

      <h2>
        👥 Collaboration Invitations
      </h2>


      <p className="text-secondary">
        Invitations from other
        CollabCode users appear here.
      </p>


      {invitations.length ===
        0 && (

        <div
          className="empty-state"

          style={{
            marginTop:
              '24px',
          }}
        >
          <h3>
            No invitations
          </h3>

          <p>
            When a friend invites you
            to collaborate, it will
            appear here.
          </p>
        </div>

      )}


      <div
        style={{
          display:
            'grid',

          gap:
            '16px',

          marginTop:
            '24px',
        }}
      >

        {invitations.map(
          (
            invitation
          ) => {

            const problem =
              invitation.room
                ?.problem;


            return (
              <div
                key={
                  invitation._id
                }

                className="card"

                style={{
                  padding:
                    '20px',
                }}
              >

                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'flex-start',

                    gap:
                      '12px',

                    flexWrap:
                      'wrap',
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin:
                          0,
                      }}
                    >
                      {
                        problem?.title ||
                        'Collaboration Room'
                      }
                    </h3>


                    {problem
                      ?.difficulty && (

                      <span
                        className={`badge ${
                          DIFFICULTY_COLORS[
                            problem
                              .difficulty
                          ] ||
                          ''
                        }`}

                        style={{
                          marginTop:
                            '8px',
                        }}
                      >
                        {
                          problem
                            .difficulty
                        }
                      </span>

                    )}

                  </div>


                  <span className="badge">
                    {
                      statusText(
                        invitation.status
                      )
                    }
                  </span>

                </div>


                <div
                  className="example"

                  style={{
                    marginTop:
                      '16px',
                  }}
                >

                  <strong>
                    Invited by:
                  </strong>{' '}

                  {
                    invitation
                      .invitedBy
                      ?.name ||
                    'User'
                  }

                  <br />


                  <strong>
                    Room:
                  </strong>{' '}

                  {
                    invitation
                      .roomCode
                  }

                  <br />


                  <strong>
                    Language:
                  </strong>{' '}

                  {
                    invitation
                      .room
                      ?.currentLanguage ||
                    'Unknown'
                  }

                </div>


                {invitation.status ===
                  'pending' && (

                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'flex-end',

                      gap:
                        '10px',

                      marginTop:
                        '18px',
                    }}
                  >

                    <button
                      className="btn btn-ghost"

                      disabled={
                        processingId ===
                        invitation._id
                      }

                      onClick={() =>
                        handleDecline(
                          invitation
                        )
                      }
                    >
                      Decline
                    </button>


                    <button
                      className="btn btn-success"

                      disabled={
                        processingId ===
                        invitation._id
                      }

                      onClick={() =>
                        handleAccept(
                          invitation
                        )
                      }
                    >

                      {processingId ===
                      invitation._id
                        ? 'Joining...'
                        : '✅ Accept & Join'}

                    </button>

                  </div>

                )}


                {invitation.status ===
                  'accepted' &&
                  invitation.room
                    ?.status ===
                    'active' && (

                  <div
                    style={{
                      display:
                        'flex',

                      justifyContent:
                        'flex-end',

                      marginTop:
                        '18px',
                    }}
                  >

                    <button
                      className="btn btn-primary"

                      onClick={() =>
                        navigate(
                          `/room/${invitation.roomCode}`
                        )
                      }
                    >
                      Open Room
                    </button>

                  </div>

                )}

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}