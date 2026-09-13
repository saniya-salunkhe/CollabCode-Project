import {
  useEffect,
  useState
} from 'react';

import {
  useNavigate
} from 'react-router-dom';

import {
  helpRequestService
} from '../services';

import {
  toast
} from '../components/ToastContainer';

export default function HelpRequests() {

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const navigate =
    useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data } =
        await helpRequestService.getOpen();

      setRequests(data);

    } catch (err) {
      console.error(
        'Failed to load help requests',
        err
      );

    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (id) => {
    try {
      const { data } =
        await helpRequestService.accept(
          id
        );

      toast.success(
        'Help request accepted!'
      );

      navigate(
        `/room/${data.roomCode}`
      );

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Unable to accept request'
      );
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading help requests...
      </div>
    );
  }

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div>
          <h1>Help Requests</h1>

          <p className="text-secondary">
            Help other students who are
            stuck on coding problems.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (

        <div className="empty-state">

          <div className="icon">
            🤝
          </div>

          <p>
            No students currently need
            help.
          </p>

        </div>

      ) : (

        <div className="problem-list">

          {requests.map((request) => (

            <div
              key={request._id}
              className="problem-card"
            >

              <div>

                <div className="title">
                  {request.problem?.title}
                </div>

                <div className="meta">

                  <span>
                    👤 {
                      request.requester?.name
                    }
                  </span>

                  <span className="badge badge-info">
                    {request.language}
                  </span>

                  <span
                    className={`badge ${
                      request.problem
                        ?.difficulty ===
                        'Easy'
                        ? 'badge-easy'
                        : request.problem
                            ?.difficulty ===
                            'Medium'
                        ? 'badge-medium'
                        : 'badge-hard'
                    }`}
                  >
                    {
                      request.problem
                        ?.difficulty
                    }
                  </span>

                </div>

                {request.message && (
                  <p className="text-sm mt-2">
                    {request.message}
                  </p>
                )}

              </div>

              <button
                className="btn btn-primary"
                onClick={() =>
                  acceptRequest(
                    request._id
                  )
                }
              >
                🤝 Help
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}
