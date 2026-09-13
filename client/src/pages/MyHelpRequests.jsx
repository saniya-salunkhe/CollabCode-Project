import {
  useEffect,
  useState,
} from 'react';

import {
  helpRequestService,
} from '../services';

import {
  DIFFICULTY_COLORS,
} from '../utils/constants';

import {
  toast,
} from '../components/ToastContainer';


export default function MyHelpRequests() {
  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState(null);

  const [
    showSolutionModal,
    setShowSolutionModal,
  ] = useState(false);

  const [
    showAskAgainModal,
    setShowAskAgainModal,
  ] = useState(false);

  const [
    askAgainMessage,
    setAskAgainMessage,
  ] = useState('');

  const [
    processing,
    setProcessing,
  ] = useState(false);


  // ============================================================
  // LOAD MY HELP REQUESTS
  // ============================================================

  const loadRequests =
    async () => {
      try {
        setLoading(true);

        const { data } =
          await helpRequestService.getMine();

        setRequests(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {
        console.error(
          'Load my help requests error:',
          err
        );

        toast.error(
          err.response?.data?.message ||
            'Failed to load your help requests'
        );

      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadRequests();
  }, []);


  // ============================================================
  // GET LATEST RESOLUTION
  // ============================================================

  const getLatestResolution =
    (request) => {
      if (
        !request?.resolutions ||
        request.resolutions.length === 0
      ) {
        return null;
      }

      return request.resolutions[
        request.resolutions.length - 1
      ];
    };


  // ============================================================
  // VIEW SOLUTION
  // ============================================================

  const handleViewSolution =
    (request) => {
      setSelectedRequest(
        request
      );

      setShowSolutionModal(
        true
      );
    };


  // ============================================================
  // UNDERSTOOD & RESOLVE
  // ============================================================

  const handleResolve =
    async () => {
      if (
        !selectedRequest?._id
      ) {
        toast.error(
          'Help request information is missing'
        );

        return;
      }


      try {
        setProcessing(true);


        const { data } =
          await helpRequestService.resolve(
            selectedRequest._id
          );


        // ------------------------------------------------------
        // UPDATE LOCAL CARD IMMEDIATELY
        // ------------------------------------------------------

        setRequests(
          (previous) =>
            previous.map(
              (request) =>
                request._id ===
                selectedRequest._id
                  ? {
                      ...request,

                      status:
                        'resolved',
                    }
                  : request
            )
        );


        // ------------------------------------------------------
        // UPDATE SELECTED REQUEST
        // ------------------------------------------------------

        setSelectedRequest(
          (previous) =>
            previous
              ? {
                  ...previous,

                  status:
                    'resolved',
                }
              : previous
        );


        toast.success(
          data?.message ||
            '✅ Help request resolved successfully'
        );


        // ------------------------------------------------------
        // CLOSE SOLUTION MODAL
        // ------------------------------------------------------

        setShowSolutionModal(
          false
        );


        setSelectedRequest(
          null
        );


        // ------------------------------------------------------
        // GET FRESH DATABASE STATE
        // ------------------------------------------------------

        await loadRequests();


      } catch (err) {
        console.error(
          'Resolve help request error:',
          err
        );


        const message =
          err.response?.data?.message ||
          'Failed to resolve help request';


        toast.error(
          message
        );


        // ------------------------------------------------------
        // If backend says already resolved,
        // refresh frontend state.
        // ------------------------------------------------------

        if (
          message
            .toLowerCase()
            .includes(
              'already resolved'
            )
        ) {
          setShowSolutionModal(
            false
          );

          setSelectedRequest(
            null
          );

          await loadRequests();
        }

      } finally {
        setProcessing(false);
      }
    };


  // ============================================================
  // OPEN ASK AGAIN MODAL
  // ============================================================

  const handleOpenAskAgain =
    () => {
      setAskAgainMessage(
        ''
      );

      setShowSolutionModal(
        false
      );

      setShowAskAgainModal(
        true
      );
    };


  // ============================================================
  // ASK AGAIN
  // ============================================================

  const handleAskAgain =
    async () => {
      if (
        !selectedRequest?._id
      ) {
        toast.error(
          'Help request information is missing'
        );

        return;
      }


      if (
        !askAgainMessage.trim()
      ) {
        toast.error(
          'Please explain what you still need help with'
        );

        return;
      }


      try {
        setProcessing(true);


        await helpRequestService.askAgain(
          selectedRequest._id,
          askAgainMessage.trim()
        );


        toast.success(
          '🆘 Help request opened again.'
        );


        setShowAskAgainModal(
          false
        );

        setSelectedRequest(
          null
        );

        setAskAgainMessage(
          ''
        );


        await loadRequests();


      } catch (err) {
        console.error(
          'Ask again error:',
          err
        );

        toast.error(
          err.response?.data?.message ||
            'Failed to ask again'
        );

      } finally {
        setProcessing(false);
      }
    };


  // ============================================================
  // STATUS DISPLAY
  // ============================================================

  const getStatusDisplay =
    (status) => {
      switch (status) {
        case 'open':
          return {
            text:
              '🆘 Waiting for Helper',

            className:
              'badge-medium',
          };


        case 'accepted':
          return {
            text:
              '🤝 Helper Working',

            className:
              'badge-medium',
          };


        case 'solution_sent':
          return {
            text:
              '✅ Solution Ready',

            className:
              'badge-easy',
          };


        case 'resolved':
          return {
            text:
              '✓ Resolved',

            className:
              'badge-easy',
          };


        case 'cancelled':
          return {
            text:
              'Cancelled',

            className:
              'badge-hard',
          };


        case 'closed':
          return {
            text:
              'Closed',

            className:
              '',
          };


        default:
          return {
            text:
              status ||
              'Unknown',

            className:
              '',
          };
      }
    };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="loading">

        <div className="spinner" />

      </div>
    );
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        padding:
          '28px',

        maxWidth:
          '1200px',

        margin:
          '0 auto',
      }}
    >

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div
        style={{
          marginBottom:
            '24px',
        }}
      >

        <h2>
          🆘 My Help Requests
        </h2>

        <p className="text-secondary">
          Track your help requests and view
          solutions sent by other students.
        </p>

      </div>


      {/* ===================================================== */}
      {/* EMPTY STATE */}
      {/* ===================================================== */}

      {requests.length === 0 && (
        <div className="empty-state">

          <h3>
            No help requests yet
          </h3>

          <p>
            When you request help from the
            Solo Editor, it will appear here.
          </p>

        </div>
      )}


      {/* ===================================================== */}
      {/* REQUEST CARDS */}
      {/* ===================================================== */}

      <div
        style={{
          display:
            'grid',

          gap:
            '16px',
        }}
      >

        {requests.map(
          (request) => {

            const status =
              getStatusDisplay(
                request.status
              );

            const resolution =
              getLatestResolution(
                request
              );


            return (
              <div
                key={
                  request._id
                }

                className="card"

                style={{
                  padding:
                    '20px',
                }}
              >

                {/* =========================================== */}
                {/* TITLE */}
                {/* =========================================== */}

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

                    <div
                      style={{
                        display:
                          'flex',

                        alignItems:
                          'center',

                        gap:
                          '8px',

                        flexWrap:
                          'wrap',
                      }}
                    >

                      <h3
                        style={{
                          margin:
                            0,
                        }}
                      >
                        {
                          request.problem
                            ?.title ||
                          'Problem'
                        }
                      </h3>


                      {request.problem
                        ?.difficulty && (

                        <span
                          className={`badge ${
                            DIFFICULTY_COLORS[
                              request.problem
                                .difficulty
                            ] || ''
                          }`}
                        >
                          {
                            request.problem
                              .difficulty
                          }
                        </span>

                      )}

                    </div>


                    <div
                      className="text-secondary text-sm"

                      style={{
                        marginTop:
                          '8px',
                      }}
                    >

                      Language:{' '}

                      <strong>
                        {
                          request.language
                        }
                      </strong>

                    </div>

                  </div>


                  <span
                    className={`badge ${status.className}`}
                  >
                    {
                      status.text
                    }
                  </span>

                </div>


                {/* =========================================== */}
                {/* QUESTION */}
                {/* =========================================== */}

                <div
                  className="example"

                  style={{
                    marginTop:
                      '16px',
                  }}
                >

                  <strong>
                    Your Question
                  </strong>

                  <br />

                  {
                    request.message
                  }

                </div>


                {/* =========================================== */}
                {/* HELPER */}
                {/* =========================================== */}

                {request.helper && (
                  <div
                    className="text-secondary text-sm"

                    style={{
                      marginTop:
                        '12px',
                    }}
                  >

                    Helper:{' '}

                    <strong>
                      {
                        request.helper
                          .name
                      }
                    </strong>

                  </div>
                )}


                {/* =========================================== */}
                {/* SOLUTION SUMMARY */}
                {/* =========================================== */}

                {resolution && (
                  <div
                    style={{
                      marginTop:
                        '16px',
                    }}
                  >

                    <div>

                      <strong>
                        Problem Found:
                      </strong>{' '}

                      {
                        resolution
                          .problemFound
                      }

                    </div>


                    {resolution.testResult && (
                      <div
                        style={{
                          marginTop:
                            '8px',
                        }}
                      >

                        <strong>
                          Test Result:
                        </strong>{' '}

                        {resolution
                          .testResult
                          .allPassed
                          ? '✅'
                          : '⚠️'}{' '}

                        {
                          resolution
                            .testResult
                            .passed
                        }

                        /

                        {
                          resolution
                            .testResult
                            .total
                        }{' '}

                        passed

                      </div>
                    )}

                  </div>
                )}


                {/* =========================================== */}
                {/* SOLUTION READY */}
                {/* =========================================== */}

                {request.status ===
                  'solution_sent' && (

                  <div
                    style={{
                      marginTop:
                        '18px',

                      display:
                        'flex',

                      justifyContent:
                        'flex-end',
                    }}
                  >

                    <button
                      className="btn btn-success"

                      onClick={() =>
                        handleViewSolution(
                          request
                        )
                      }
                    >
                      👁 View Solution
                    </button>

                  </div>

                )}


                {/* =========================================== */}
                {/* RESOLVED */}
                {/* =========================================== */}

                {request.status ===
                  'resolved' &&
                  resolution && (

                  <div
                    style={{
                      marginTop:
                        '18px',

                      display:
                        'flex',

                      justifyContent:
                        'flex-end',
                    }}
                  >

                    <button
                      className="btn btn-secondary"

                      onClick={() =>
                        handleViewSolution(
                          request
                        )
                      }
                    >
                      👁 View Previous Solution
                    </button>

                  </div>

                )}

              </div>
            );
          }
        )}

      </div>


      {/* ===================================================== */}
      {/* SOLUTION MODAL */}
      {/* ===================================================== */}

      {showSolutionModal &&
        selectedRequest && (

        <div
          className="modal-overlay"

          onClick={() => {
            if (!processing) {
              setShowSolutionModal(
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
              width:
                '95%',

              maxWidth:
                '1100px',

              maxHeight:
                '92vh',

              overflowY:
                'auto',
            }}
          >

            {(() => {

              const resolution =
                getLatestResolution(
                  selectedRequest
                );


              if (!resolution) {
                return (
                  <>
                    <h3>
                      Solution
                    </h3>

                    <p>
                      No solution is available.
                    </p>

                    <div className="modal-actions">

                      <button
                        className="btn btn-ghost"

                        onClick={() =>
                          setShowSolutionModal(
                            false
                          )
                        }
                      >
                        Close
                      </button>

                    </div>
                  </>
                );
              }


              return (
                <>

                  {/* ========================================= */}
                  {/* HEADER */}
                  {/* ========================================= */}

                  <h2>
                    ✅ Solution Received
                  </h2>


                  <p className="text-secondary">

                    Your problem was solved by{' '}

                    <strong>
                      {
                        selectedRequest
                          .helper
                          ?.name ||
                        resolution
                          .solvedBy
                          ?.name ||
                        'Helper'
                      }
                    </strong>.

                  </p>


                  <div className="example">

                    <strong>
                      Problem:
                    </strong>{' '}

                    {
                      selectedRequest
                        .problem
                        ?.title
                    }

                    <br />


                    <strong>
                      Your Question:
                    </strong>{' '}

                    {
                      selectedRequest
                        .message
                    }

                  </div>


                  {/* ========================================= */}
                  {/* PROBLEM FOUND */}
                  {/* ========================================= */}

                  <div
                    style={{
                      marginTop:
                        '20px',
                    }}
                  >

                    <h3>
                      🔍 Problem Found
                    </h3>


                    <p
                      style={{
                        whiteSpace:
                          'pre-wrap',
                      }}
                    >
                      {
                        resolution
                          .problemFound
                      }
                    </p>


                    <p>

                      <strong>
                        Issue Type:
                      </strong>{' '}

                      {
                        resolution
                          .issueType ||
                        'Not specified'
                      }

                    </p>


                    {resolution
                      .incorrectLocation && (

                      <p>

                        <strong>
                          Incorrect Location:
                        </strong>{' '}

                        {
                          resolution
                            .incorrectLocation
                        }

                      </p>

                    )}

                  </div>


                  {/* ========================================= */}
                  {/* WHY WRONG */}
                  {/* ========================================= */}

                  <div
                    style={{
                      marginTop:
                        '20px',
                    }}
                  >

                    <h3>
                      ❓ Why Was It Wrong?
                    </h3>


                    <p
                      style={{
                        whiteSpace:
                          'pre-wrap',

                        lineHeight:
                          1.6,
                      }}
                    >
                      {
                        resolution
                          .whyWrong
                      }
                    </p>

                  </div>


                  {/* ========================================= */}
                  {/* CHANGES MADE */}
                  {/* ========================================= */}

                  <div
                    style={{
                      marginTop:
                        '20px',
                    }}
                  >

                    <h3>
                      🔧 Changes Made
                    </h3>


                    <p
                      style={{
                        whiteSpace:
                          'pre-wrap',

                        lineHeight:
                          1.6,
                      }}
                    >
                      {
                        resolution
                          .changesMade
                      }
                    </p>

                  </div>


                  {/* ========================================= */}
                  {/* SOLUTION EXPLANATION */}
                  {/* ========================================= */}

                  <div
                    style={{
                      marginTop:
                        '20px',
                    }}
                  >

                    <h3>
                      💡 How the Corrected Solution Works
                    </h3>


                    <p
                      style={{
                        whiteSpace:
                          'pre-wrap',

                        lineHeight:
                          1.6,
                      }}
                    >
                      {
                        resolution
                          .solutionExplanation
                      }
                    </p>

                  </div>


                  {/* ========================================= */}
                  {/* TEST RESULT */}
                  {/* ========================================= */}

                  <div
                    className="example"

                    style={{
                      marginTop:
                        '20px',
                    }}
                  >

                    <strong>
                      🧪 Test Result
                    </strong>

                    <br />


                    {resolution
                      .testResult
                      ?.allPassed
                      ? '✅'
                      : '⚠️'}{' '}

                    {
                      resolution
                        .testResult
                        ?.passed ||
                      0
                    }

                    /

                    {
                      resolution
                        .testResult
                        ?.total ||
                      0
                    }{' '}

                    test cases passed

                  </div>


                  {/* ========================================= */}
                  {/* BEFORE / AFTER */}
                  {/* ========================================= */}

                  <h3
                    style={{
                      marginTop:
                        '24px',
                    }}
                  >
                    🔄 Code Changes
                  </h3>


                  <div
                    style={{
                      display:
                        'grid',

                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(320px, 1fr))',

                      gap:
                        '16px',

                      marginTop:
                        '12px',
                    }}
                  >

                    {/* BEFORE */}

                    <div>

                      <h4>
                        ❌ Before
                      </h4>


                      <pre
                        style={{
                          padding:
                            '14px',

                          overflowX:
                            'auto',

                          overflowY:
                            'auto',

                          maxHeight:
                            '400px',

                          whiteSpace:
                            'pre',

                          borderRadius:
                            '8px',

                          background:
                            '#111827',
                        }}
                      >
                        {
                          resolution
                            .oldCode
                        }
                      </pre>

                    </div>


                    {/* AFTER */}

                    <div>

                      <h4>
                        ✅ After
                      </h4>


                      <pre
                        style={{
                          padding:
                            '14px',

                          overflowX:
                            'auto',

                          overflowY:
                            'auto',

                          maxHeight:
                            '400px',

                          whiteSpace:
                            'pre',

                          borderRadius:
                            '8px',

                          background:
                            '#111827',
                        }}
                      >
                        {
                          resolution
                            .newCode
                        }
                      </pre>

                    </div>

                  </div>


                  {/* ========================================= */}
                  {/* ACTIONS */}
                  {/* ========================================= */}

                  <div className="modal-actions">

                    <button
                      className="btn btn-ghost"

                      onClick={() =>
                        setShowSolutionModal(
                          false
                        )
                      }

                      disabled={
                        processing
                      }
                    >
                      Close
                    </button>


                    {selectedRequest.status ===
                      'solution_sent' && (
                      <>

                        <button
                          className="btn btn-warning"

                          onClick={
                            handleOpenAskAgain
                          }

                          disabled={
                            processing
                          }
                        >
                          🆘 Ask Again
                        </button>


                        <button
                          className="btn btn-success"

                          onClick={
                            handleResolve
                          }

                          disabled={
                            processing
                          }
                        >
                          {processing
                            ? 'Resolving...'
                            : '✅ Understood & Resolve'}
                        </button>

                      </>
                    )}


                    {selectedRequest.status ===
                      'resolved' && (

                      <span className="badge badge-easy">
                        ✓ Already Resolved
                      </span>

                    )}

                  </div>

                </>
              );

            })()}

          </div>

        </div>

      )}


      {/* ===================================================== */}
      {/* ASK AGAIN MODAL */}
      {/* ===================================================== */}

      {showAskAgainModal &&
        selectedRequest && (

        <div
          className="modal-overlay"

          onClick={() => {
            if (!processing) {
              setShowAskAgainModal(
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
          >

            <h3>
              🆘 Ask Again
            </h3>


            <p className="text-secondary text-sm">

              Explain what you still do not
              understand. Your request will
              become available to helpers again.

            </p>


            <textarea
              value={
                askAgainMessage
              }

              onChange={(e) =>
                setAskAgainMessage(
                  e.target.value
                )
              }

              placeholder="Example: I understand the approach now, but I still don't understand why both pointers move after the swap."

              maxLength={
                250
              }

              disabled={
                processing
              }

              style={{
                width:
                  '100%',

                minHeight:
                  '120px',

                marginTop:
                  '12px',

                resize:
                  'vertical',
              }}
            />


            <div
              className="text-muted text-sm"

              style={{
                textAlign:
                  'right',

                marginTop:
                  '4px',
              }}
            >

              {
                askAgainMessage
                  .length
              }
              /250

            </div>


            <div className="modal-actions">

              <button
                className="btn btn-ghost"

                onClick={() => {
                  setShowAskAgainModal(
                    false
                  );

                  setAskAgainMessage(
                    ''
                  );
                }}

                disabled={
                  processing
                }
              >
                Cancel
              </button>


              <button
                className="btn btn-warning"

                onClick={
                  handleAskAgain
                }

                disabled={
                  processing ||
                  !askAgainMessage
                    .trim()
                }
              >
                {processing
                  ? 'Sending...'
                  : '🆘 Ask Again'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}