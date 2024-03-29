'use client';
import BookingCard from '@/components/Card/BookingCard';
import BookingDetailCard from '@/components/Card/BookingDetailCard';
import DebounceSelect from '@/components/Search/DebounceSelect';
import { sortByField } from '@/helper';
import usePagination from '@/hook/usePagination';
import usePaginationLoadMore from '@/hook/usePaginationLoadMore';
import { getCustomerService } from '@/services/customner.service';
import {
  getBookingByIdService,
  getBookingService,
  updateStatusBookingService
} from '@/services/restaurant.booking.service';
import useStoreBranchesStore from '@/store/storeBranches';
import { DatePicker, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

function OrderManagement() {
  const { storeBranchActive, storeBranches } = useStoreBranchesStore(
    useShallow((state) => ({
      storeBranchActive: state.storeBranchActive,
      storeBranches: state.storeBranches
    }))
  );
  const [totalRows, pageIndex, setPageIndex] = usePaginationLoadMore(10);

  const [bookingData, setBookingData] = useState([]);
  const [bookingQueries, setBookingQueries] = useState({
    RestaurantId: storeBranchActive.id,
    BookingDate: dayjs().format('YYYY-MM-DD'),
    TotalRows: 10,
    SkipRows: 0
  });
  const [sortDirection, setSortDirection] = useState('asc');
  const [sortByFieldValue, setSortByFieldValue] = useState('modifiedDate');
  const [valueSearch, setValueSearch] = useState('');
  const [bookingIdSelected, setBookingIdSelected] = useState();
  const [bookingActive, setBookingActive] = useState({});

  const [isBookingStatusUpdated, setIsBookingStatusUpdated] = useState(false);
  useEffect(() => {
    if (valueSearch) {
      setBookingQueries((prev) => {
        return {
          ...prev,
          CustomerId: valueSearch
        };
      });
    } else {
      setBookingQueries((prev) => {
        const { CustomerId, ...rest } = prev;
        return rest;
      });
    }
  }, [valueSearch]);

  useEffect(() => {
    setBookingQueries((prev) => {
      return {
        ...prev,
        TotalRows: totalRows,
        SkipRows: 0
      };
    });
  }, [pageIndex]);

  useEffect(() => {
    if (storeBranchActive.id)
      setBookingQueries((prev) => {
        return {
          ...prev,
          RestaurantId: storeBranchActive.id
        };
      });
  }, [storeBranchActive]);

  // Auto recall API after 5s
  useEffect(() => {
    const fetchBookingData = (payload) => {
      getBookingService(payload)
        .then((response) => {
          const dataBooing = sortByField(
            response?.data?.items,
            sortByFieldValue,
            sortDirection
          );
          setBookingData(dataBooing);
        })
        .catch((error) => {
          console.error('Error fetching Booking Service', error);
        })
        .finally(() => {
          setIsBookingStatusUpdated(false);
        });
    };

    if (bookingQueries.RestaurantId) {
      fetchBookingData(bookingQueries);
    }

    const fetchDataInterval = setInterval(() => {
      if (bookingQueries.RestaurantId) {
        fetchBookingData(bookingQueries);
      }
    }, 10000); // 10s

    return () => clearInterval(fetchDataInterval);
  }, [bookingQueries, isBookingStatusUpdated, sortByFieldValue, sortDirection]);

  useEffect(() => {
    const fetchBookingDetailById = (id) => {
      getBookingByIdService(id)
        .then((response) => {
          const dataBooingDetail = response?.data?.data;
          setBookingActive({
            bookingDetail: dataBooingDetail
          });
        })
        .catch((error) => {
          console.error('Error fetching Booking Detail Service', error);
        })
        .finally(() => {
          setIsBookingStatusUpdated(false);
        });
    };
    if (bookingIdSelected) {
      fetchBookingDetailById(bookingIdSelected);
    }
  }, [bookingIdSelected, isBookingStatusUpdated]);

  const handleChangeDateFilter = (date, dateString) => {
    if (!dateString) {
      setBookingQueries((prev) => {
        const { BookingDate, ...newPrev } = prev;
        return newPrev;
      });
    } else {
      setBookingQueries((prev) => ({
        ...prev,
        BookingDate: dayjs(dateString).format('YYYY-MM-DD')
      }));
    }
  };

  const handleChangeStatusFilter = (status) => {
    if (!status.length) {
      setBookingQueries((prev) => {
        const { BookingStatus, ...newPrev } = prev;
        return newPrev;
      });
    } else {
      setBookingQueries((prev) => ({
        ...prev,
        BookingStatus: status
      }));
    }
  };

  const handleUpdateStatusBooking = async (bookingId, newStatus) => {
    const payload = {
      bookingIds: [bookingId],
      bookingStatus: newStatus
    };
    try {
      const response = await updateStatusBookingService(payload);
      setIsBookingStatusUpdated(true);
    } catch (error) {
      console.error('Error Update Booking Status Service', error);
    }
  };

  const colorRenderWithStatus = (value) => {
    if (value === 'New') {
      return '#4bae4b';
    } else if (value === 'Confirm') {
      return '#2db7f5';
    } else if (value === 'Cancelled') {
      return 'red';
    } else if (value === 'Completed') {
      return 'purple';
    } else {
      return 'gray';
    }
  };

  const tagRender = (props) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tag
        color={colorRenderWithStatus(value)}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{
          marginRight: 3
        }}>
        {label}
      </Tag>
    );
  };

  const fetchCustomerList = async (username) => {
    return getCustomerService({
      SearchText: username,
      TotalRows: 50,
      SkipRows: 0
    })
      .then((response) => response?.data?.items)
      .then((items) => {
        return items.map((customer) => ({
          label: `${customer.name} - ${
            !!customer?.email ? customer.email : 'No email'
          } - ${!!customer?.phoneNumber ? customer.phoneNumber : 'No phone'}`,
          value: customer.id
        }));
      });
  };

  return (
    <div className='h-full w-full flex-row'>
      <div className='p-2 flex-none h-14'>
        <div className='flex gap-10'>
          <div className='flex items-center gap-2'>
            <p>Filter by Date:</p>
            <DatePicker
              format={'MM/DD/YYYY'}
              defaultValue={dayjs()}
              onChange={handleChangeDateFilter}
            />
          </div>
          <div className='flex items-center gap-2'>
            <p>Filter by Status:</p>
            <Select
              allowClear
              tagRender={tagRender}
              style={{ minWidth: 200 }}
              mode='multiple'
              onChange={handleChangeStatusFilter}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Confirm', label: 'Confirm' },
                { value: 'Using', label: 'Using' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' }
              ]}
            />
          </div>

          <div className='flex items-center gap-2'>
            <p>Sort by:</p>
            <Select
              allowClear
              tagRender={tagRender}
              style={{ minWidth: 150 }}
              value={sortByFieldValue}
              onChange={(newValue) => {
                setSortByFieldValue(newValue);
                const dataBooing = sortByField(
                  bookingData,
                  newValue,
                  sortDirection
                );
                setBookingData(dataBooing);
              }}
              options={[
                { value: 'bookingDate', label: 'Booking Date' },
                { value: 'modifiedDate', label: 'Modified Date' },
                { value: 'createdDate', label: 'Created Date' }
              ]}
            />
            <Select
              allowClear
              tagRender={tagRender}
              style={{ minWidth: 80 }}
              value={sortDirection}
              onChange={(newValue) => setSortDirection(newValue)}
              options={[
                { value: 'asc', label: 'ASC' },
                { value: 'desc', label: 'DESC' }
              ]}
            />
          </div>

          <div className='flex items-center gap-2'>
            <p>Search:</p>
            <DebounceSelect
              showSearch
              value={valueSearch}
              placeholder='search customer'
              fetchOptions={fetchCustomerList}
              onChange={(newValue) => {
                setValueSearch(newValue);
              }}
              style={{
                width: 500
              }}
            />
          </div>
        </div>
      </div>
      <div className='booking-panel flex flex-1 h-full pb-14 '>
        <div className='flex-[1] pt-4 overflow-y-scroll border-2 mx-2'>
          {bookingData && bookingData.length > 0 && (
            <div className='flex justify-center '>
              <button
                className='bg-gray-300 rounded-2xl py-1 px-4'
                onClick={() => setPageIndex(pageIndex + 1)}>
                load more ({totalRows} items)
              </button>
            </div>
          )}
          {bookingData.map((booking) => (
            <BookingCard
              key={booking.id}
              isActive={booking.id === bookingIdSelected}
              onUpdateStatusBooking={handleUpdateStatusBooking}
              onSelected={setBookingIdSelected}
              colorStatus={colorRenderWithStatus(booking.bookingStatusId)}
              booking={booking}
            />
          ))}
          {bookingData && bookingData.length > 0 && (
            <div className='flex justify-center '>
              <button
                className='bg-gray-300 rounded-2xl py-1 px-4 mb-4'
                onClick={() => setPageIndex(pageIndex + 1)}>
                load more ({totalRows} items)
              </button>
            </div>
          )}
          {!bookingData ||
            (bookingData?.length === 0 && (
              <div className='flex justify-center '>
                <span className='bg-gray-300 text-lg rounded-2xl py-1 px-4 mb-4'>
                  No data
                </span>
              </div>
            ))}
        </div>
        <div className='flex-[2] w-full'>
          {bookingData?.length > 0 && bookingActive?.bookingDetail && (
            <BookingDetailCard
              bookingActive={bookingActive}
              colorStatus={colorRenderWithStatus(
                bookingActive.bookingDetail?.bookingStatusId
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderManagement;
