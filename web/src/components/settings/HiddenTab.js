/*
- File: HiddenTab.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Settings > Hidden tab. On mount, dispatches
fetchPackages({ hidden: true }) which writes to state.packages.hiddenItems
per Slice 3's two-bucket invariant. Renders an inline thin Table sorted
by comparePackages (the same priority sort the dashboard uses). Per-row
"Unhide" button dispatches patchPackage(id, { hidden: false }); the
existing patchPackage.fulfilled reducer migrates the row to items so the
row leaves the page on response. A toast confirms either way (secondary
on success, danger on failure with the api error message).
 */

import { useEffect, useMemo } from 'react';
import { Table, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPackages, patchPackage } from '../../store/packagesSlice';
import { pushToast } from '../../store/uiSlice';
import { comparePackages } from '../../lib/comparePackages';
import { carrierDisplay } from '../../lib/carrierDisplay';
import { relTime } from '../../lib/relTime';
import StatusChip from '../packages/StatusChip';
import CarrierBadge from '../packages/CarrierBadge';
import Spinner from '../shared/Spinner';
import ErrorAlert from '../shared/ErrorAlert';

export default function HiddenTab() {
  const dispatch = useDispatch();
  const { hiddenItems, listStatus, listError } = useSelector((s) => s.packages);

  useEffect(() => {
    dispatch(fetchPackages({ hidden: true }));
  }, [dispatch]);

  const sorted = useMemo(() => [...hiddenItems].sort(comparePackages), [hiddenItems]);

  const handleUnhide = (pkg) => {
    dispatch(patchPackage({ id: pkg.id, fields: { hidden: false } })).then((action) => {
      if (action.meta.requestStatus === 'fulfilled') {
        dispatch(
          pushToast({
            variant: 'secondary',
            message: 'Unhidden. Back on dashboard.',
          })
        );
      } else {
        dispatch(
          pushToast({
            variant: 'danger',
            message: action.payload?.message || 'Could not unhide. Try again.',
          })
        );
      }
    });
  };

  return (
    <div>
      <h4 className="mb-3">Hidden packages</h4>
      {listError ? <ErrorAlert error={listError} /> : null}
      {listStatus === 'loading' && hiddenItems.length === 0 ? (
        <Spinner />
      ) : hiddenItems.length === 0 ? (
        <p className="text-muted fst-italic">Nothing hidden yet.</p>
      ) : (
        <Table hover>
          <thead>
            <tr>
              <th>Carrier</th>
              <th>Package</th>
              <th>Status</th>
              <th>Hidden since</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pkg) => {
              const display = pkg.nickname || `Package #${pkg.tracking_number.slice(-6)}`;
              return (
                <tr key={pkg.id}>
                  <td>
                    <CarrierBadge code={pkg.carrier} />
                    <span className="visually-hidden">{carrierDisplay(pkg.carrier)}</span>
                  </td>
                  <td>
                    <div className="fw-semibold">{display}</div>
                    <small className="text-muted font-monospace">{pkg.tracking_number}</small>
                  </td>
                  <td>
                    <StatusChip status={pkg.latest_event?.status} />
                  </td>
                  <td>
                    <small className="text-muted">{relTime(pkg.created_at)}</small>
                  </td>
                  <td className="text-end">
                    <Button variant="outline-primary" size="sm" onClick={() => handleUnhide(pkg)}>
                      Unhide
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
