/*
- File: PackageDetailPage.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: The package detail screen. Shows the header card (nickname,
tracking, status, carrier, last-checked, copy + refresh + carrier-page
buttons) above an EventTimeline. Refresh is FedEx-only via hasApi();
carrier-page link uses pkg.tracking_url for any carrier with a non-null
URL. Copy-to-clipboard is a side effect that pushes a toast on success.
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Button, Stack } from 'react-bootstrap';
import { FaArrowLeft, FaSync, FaExternalLinkAlt, FaRegCopy } from 'react-icons/fa';
import { fetchPackageDetail, refreshPackage } from '../store/packagesSlice';
import { pushToast } from '../store/uiSlice';
import { hasApi } from '../lib/hasApi';
import { carrierDisplay } from '../lib/carrierDisplay';
import { relTime } from '../lib/relTime';
import StatusChip from '../components/packages/StatusChip';
import CarrierBadge from '../components/packages/CarrierBadge';
import EventTimeline from '../components/packages/EventTimeline';
import EmptyState from '../components/shared/EmptyState';
import ErrorAlert from '../components/shared/ErrorAlert';
import Spinner from '../components/shared/Spinner';

function refreshToastForResponse(refresh, displayName) {
  if (refresh.skipped) {
    if (refresh.skip_reason === 'carrier_unavailable' || refresh.skip_reason === 'auth_failed') {
      return {
        variant: 'warning',
        message: "Couldn't reach the carrier right now. Try again in a minute.",
      };
    }
    if (refresh.skip_reason === 'not_found' || refresh.skip_reason === 'bad_request') {
      return {
        variant: 'warning',
        message:
          "The carrier doesn't recognize this tracking number yet. It may take a few hours after a label is created.",
      };
    }
    return { variant: 'secondary', message: 'Already up to date.' };
  }
  if (refresh.inserted_event_count > 0) {
    return {
      variant: 'success',
      message: `${refresh.inserted_event_count} new event(s) for ${displayName}.`,
    };
  }
  return { variant: 'secondary', message: 'Already up to date.' };
}

export default function PackageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { detail, detailStatus, detailError, refreshingId } = useSelector((s) => s.packages);

  useEffect(() => {
    dispatch(fetchPackageDetail(id));
  }, [dispatch, id]);

  if (detailStatus === 'loading' && !detail) return <Spinner />;
  if (detailError) return <ErrorAlert error={detailError} />;
  if (!detail) return null;

  const display = detail.nickname || `Package #${detail.tracking_number.slice(-6)}`;
  const isRefreshing = refreshingId === detail.id;

  const handleRefresh = () => {
    dispatch(refreshPackage(detail.id)).then((action) => {
      if (action.meta.requestStatus !== 'fulfilled') {
        dispatch(
          pushToast({
            variant: 'danger',
            message: action.payload?.message || 'Refresh failed.',
          })
        );
        return;
      }
      const { refresh } = action.payload;
      dispatch(pushToast(refreshToastForResponse(refresh, display)));
    });
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(detail.tracking_number)
      .then(() => dispatch(pushToast({ variant: 'success', message: 'Copied tracking number.' })))
      .catch(() =>
        dispatch(pushToast({ variant: 'danger', message: 'Could not copy to clipboard.' }))
      );
  };

  return (
    <>
      <Button variant="link" className="ps-0 mb-3" onClick={() => navigate(-1)}>
        <FaArrowLeft className="me-1" />
        Back
      </Button>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-start">
            <Col>
              <Card.Title className="mb-2">{display}</Card.Title>
              <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                <span className="font-monospace">{detail.tracking_number}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  aria-label="Copy tracking number"
                  onClick={handleCopy}
                >
                  <FaRegCopy />
                </Button>
              </Stack>
              <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                <StatusChip status={detail.latest_event?.status} />
                <CarrierBadge code={detail.carrier} />
              </Stack>
              <small className="text-muted">Last checked {relTime(detail.last_checked_at)}</small>
            </Col>
            <Col xs="auto">
              <Stack direction="horizontal" gap={2}>
                {hasApi(detail.carrier) ? (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? <Spinner size="sm" /> : <FaSync className="me-1" />}
                    Refresh
                  </Button>
                ) : null}
                {detail.tracking_url ? (
                  <Button
                    as="a"
                    variant="outline-secondary"
                    size="sm"
                    href={detail.tracking_url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <FaExternalLinkAlt className="me-1" />
                    Track on {carrierDisplay(detail.carrier)}
                  </Button>
                ) : null}
              </Stack>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {detail.events && detail.events.length > 0 ? (
        <EventTimeline events={detail.events} />
      ) : (
        <EmptyState
          title="No events yet"
          body="The carrier has not posted any updates for this number."
        />
      )}
    </>
  );
}
