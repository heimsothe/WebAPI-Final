/*
- File: ExclusionsTab.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Settings > Exclusions tab. On mount, dispatches
fetchExclusions(). Renders a permanent educational info Alert above an
inline thin Table; the Table lists tracking number / carrier / nickname /
excluded-since with a per-row Remove button. Remove opens the shared
ConfirmModal; confirm dispatches removeExclusion(id) and pushes a toast.
removeExclusion is non-optimistic per Slice 6 decision B: the row leaves
the table on .fulfilled (the slice reducer filters it out). A local
removingId useState gates the per-row Remove button so the user can't
double-fire while the request is in flight.
 */

import { useEffect, useState } from 'react';
import { Table, Button, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExclusions, removeExclusion } from '../../store/exclusionsSlice';
import { pushToast } from '../../store/uiSlice';
import { carrierDisplay } from '../../lib/carrierDisplay';
import { relTime } from '../../lib/relTime';
import Spinner from '../shared/Spinner';
import ErrorAlert from '../shared/ErrorAlert';
import ConfirmModal from '../shared/ConfirmModal';

export default function ExclusionsTab() {
  const dispatch = useDispatch();
  const { items, status, error } = useSelector((s) => s.exclusions);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    dispatch(fetchExclusions());
  }, [dispatch]);

  const confirmRemove = async () => {
    const ex = pendingRemove;
    if (!ex) return;
    setPendingRemove(null);
    setRemovingId(ex.id);
    const action = await dispatch(removeExclusion(ex.id));
    setRemovingId(null);
    if (action.meta.requestStatus === 'fulfilled') {
      dispatch(
        pushToast({
          variant: 'secondary',
          message: 'Removed from exclusions.',
        })
      );
    } else {
      dispatch(
        pushToast({
          variant: 'danger',
          message: action.payload?.message || 'Could not remove. Try again.',
        })
      );
    }
  };

  return (
    <div>
      <h4 className="mb-3">Exclusions</h4>
      <Alert variant="info">
        Removing a number from this list lets it be re-imported by the next Gmail sync. Existing
        packages are not affected.
      </Alert>
      {error ? <ErrorAlert error={error} /> : null}
      {status === 'loading' && items.length === 0 ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="text-muted fst-italic">Nothing excluded yet.</p>
      ) : (
        <Table hover>
          <thead>
            <tr>
              <th>Tracking Number</th>
              <th>Carrier</th>
              <th>Nickname</th>
              <th>Excluded</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ex) => (
              <tr key={ex.id}>
                <td className="font-monospace">{ex.tracking_number}</td>
                <td>{ex.carrier ? carrierDisplay(ex.carrier) : '-'}</td>
                <td>{ex.nickname || '-'}</td>
                <td>
                  <small className="text-muted">{relTime(ex.excluded_at)}</small>
                </td>
                <td className="text-end">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setPendingRemove(ex)}
                    disabled={removingId === ex.id}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmModal
        show={Boolean(pendingRemove)}
        title="Remove from exclusions?"
        body="This lets the tracking number be re-imported by the next Gmail sync. Existing packages are not affected."
        confirmText="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
